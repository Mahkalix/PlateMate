import type pg from "pg";
import { allows, type Status } from "../services/booking.js";
import { compatible } from "../services/scoring.js";
import { AuthError } from "../services/auth.js";
export class Bookings {
  constructor(private db: pg.Pool) {}
  private async transaction<T>(action: (c: pg.PoolClient) => Promise<T>) {
    const c = await this.db.connect();
    try {
      await c.query("BEGIN");
      const result = await action(c);
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  private async capacity(
    c: pg.PoolClient,
    slot: string,
    size: number,
    capacity: number,
  ) {
    const { rows } = await c.query(
      "SELECT coalesce(sum(party_size),0)::int AS taken FROM bookings WHERE slot_id=$1 AND status IN ('accepted','completed')",
      [slot],
    );
    if (rows[0].taken + size > capacity) throw new AuthError(409, "slot_full");
  }
  private async record(
    c: pg.PoolClient,
    id: string,
    status: Status,
    actor: string,
  ) {
    await c.query(
      "INSERT INTO booking_status_events(booking_id,status,actor_id) VALUES($1,$2,$3)",
      [id, status, actor],
    );
  }
  async create(actor: string, slot: string, size: number) {
    return this.transaction(async (c) => {
      const s = (
        await c.query(
          "SELECT s.*,ctx.host_id,ctx.safe_for,p.details FROM context_slots s JOIN contexts ctx ON ctx.id=s.context_id LEFT JOIN profiles p ON p.user_id=$2 WHERE s.id=$1 AND s.starts_at>now() FOR UPDATE OF s",
          [slot, actor],
        )
      ).rows[0];
      if (
        !s ||
        !s.details ||
        !compatible(s.details.allergies, s.details.intolerances, s.safe_for)
      )
        throw new AuthError(404, "not_found");
      if (s.host_id === actor) throw new AuthError(403, "own_context");
      await this.capacity(c, slot, size, s.capacity);
      const b = (
        await c.query(
          "INSERT INTO bookings(slot_id,guest_id,party_size) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id,status",
          [slot, actor, size],
        )
      ).rows[0];
      if (!b) throw new AuthError(409, "already_booked");
      await this.record(c, b.id, "pending", actor);
      return b;
    });
  }
  async transition(actor: string, id: string, status: Status) {
    return this.transaction(async (c) => {
      const b = (
        await c.query(
          "SELECT b.*,s.capacity,s.starts_at,ctx.host_id FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts ctx ON ctx.id=s.context_id WHERE b.id=$1 AND $2 IN (b.guest_id,ctx.host_id) FOR UPDATE OF s,b",
          [id, actor],
        )
      ).rows[0];
      if (!b) throw new AuthError(404, "not_found");
      if (actor !== b.host_id && status !== "cancelled")
        throw new AuthError(403, "host_required");
      if (!allows(b.status, status))
        throw new AuthError(409, "invalid_transition");
      if (status === "accepted") {
        if (b.starts_at <= new Date()) throw new AuthError(409, "slot_started");
        await this.capacity(c, b.slot_id, b.party_size, b.capacity);
      }
      if (status === "completed" && b.starts_at > new Date())
        throw new AuthError(409, "slot_not_started");
      await c.query("UPDATE bookings SET status=$2 WHERE id=$1", [id, status]);
      await this.record(c, id, status, actor);
      return { id, status };
    });
  }
  async payment(actor: string, id: string) {
    const r = await this.db.query(
      "UPDATE bookings SET payment_intent_status='simulated' WHERE id=$1 AND guest_id=$2 AND status='accepted' RETURNING payment_intent_status AS \"paymentIntentStatus\"",
      [id, actor],
    );
    if (!r.rowCount) throw new AuthError(404, "not_found");
    return r.rows[0];
  }
  async list(actor: string, view: "host" | "guest") {
    return (
      await this.db.query(
        `SELECT b.id,b.slot_id AS "slotId",c.id AS "contextId",c.title AS "contextTitle",s.starts_at AS "startsAt",b.party_size AS "partySize",b.status,b.payment_intent_status AS "paymentIntentStatus",p.details->>'firstName' AS "counterpartName",ARRAY(SELECT e.status::text FROM booking_status_events e WHERE e.booking_id=b.id ORDER BY e.id) AS history FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id JOIN profiles p ON p.user_id=CASE WHEN $2='host' THEN b.guest_id ELSE c.host_id END WHERE CASE WHEN $2='host' THEN c.host_id ELSE b.guest_id END=$1 ORDER BY s.starts_at,b.id`,
        [actor, view],
      )
    ).rows;
  }
}

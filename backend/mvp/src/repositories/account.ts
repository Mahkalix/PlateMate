import type pg from "pg";
import { AuthError } from "../services/auth.js";
import { mealSection, type Table } from "../services/account.js";
export class AccountRepository {
  constructor(private db: pg.Pool) {}
  async table(actor: string) {
    const { rows } = await this.db.query(
      "SELECT details FROM host_profiles WHERE user_id=$1",
      [actor],
    );
    if (!rows.length) throw new AuthError(403, "host_required");
    return { table: rows[0].details };
  }
  async saveTable(actor: string, table: Table) {
    const result = await this.db.query(
      "UPDATE host_profiles SET details=$2 WHERE user_id=$1",
      [actor, table],
    );
    if (!result.rowCount) throw new AuthError(403, "host_required");
    return { table };
  }
  async summary(actor: string) {
    const { rows } = await this.db.query(
      `
      SELECT u.email,u.created_at AS "memberSince",EXISTS(SELECT 1 FROM host_profiles WHERE user_id=$1) AS "isHost",
      (SELECT avg(r.rating)::float FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id WHERE c.host_id=$1 AND r.subject_id=$1) AS "averageRating",
      (SELECT count(DISTINCT s.id)::int FROM context_slots s JOIN contexts c ON c.id=s.context_id JOIN bookings b ON b.slot_id=s.id WHERE c.host_id=$1 AND b.status='completed') AS "mealsHosted",
      (SELECT count(DISTINCT b.guest_id)::int FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id WHERE c.host_id=$1 AND b.status='completed') AS "guestsMet",
      (SELECT count(DISTINCT c.host_id)::int FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id WHERE b.guest_id=$1 AND b.status='completed') AS "hostsMet",
      NULL::integer AS "cuisinesDiscovered"
      FROM users u WHERE u.id=$1`,
      [actor],
    );
    return rows[0];
  }
  async meals(
    actor: string,
    view: "host" | "guest",
    limit: number,
    offset: number,
  ) {
    const isHost = Boolean(
      (
        await this.db.query("SELECT 1 FROM host_profiles WHERE user_id=$1", [
          actor,
        ])
      ).rowCount,
    );
    const { rows } =
      view === "host"
        ? await this.db.query(
            `
      SELECT s.id AS "slotId",c.id AS "contextId",c.title,s.starts_at AS "startsAt",s.capacity,
      coalesce(sum(b.party_size) FILTER (WHERE b.status IN ('accepted','completed')),0)::int AS "confirmedPlaces",
      count(b.id) FILTER (WHERE b.status='pending')::int AS "pendingRequests"
      FROM context_slots s JOIN contexts c ON c.id=s.context_id LEFT JOIN bookings b ON b.slot_id=s.id
      WHERE c.host_id=$1 GROUP BY s.id,c.id ORDER BY s.starts_at,s.id LIMIT $2 OFFSET $3`,
            [actor, limit, offset],
          )
        : await this.db.query(
            `
      SELECT b.id,b.status,b.party_size AS "partySize",b.amount_cents AS "amountCents",b.payment_intent_status AS "paymentIntentStatus",
      s.id AS "slotId",c.id AS "contextId",c.title,s.starts_at AS "startsAt",c.host_id AS "hostId",
      p.details->>'firstName' AS "hostFirstName",left(p.details->>'lastName',1) AS "hostLastInitial",
      CASE WHEN b.status='accepted' THEN h.details->'address' ELSE NULL END AS address,
      (SELECT rating FROM reviews WHERE booking_id=b.id AND author_id=$1) AS "myRating",
      (SELECT CASE WHEN e.actor_id=$1 THEN 'guest' ELSE 'host' END FROM booking_status_events e WHERE e.booking_id=b.id AND e.status='cancelled' ORDER BY e.id DESC LIMIT 1) AS "cancelledBy",
      CASE WHEN b.payment_intent_status='refunded' THEN b.amount_cents ELSE 0 END AS "refundedCents"
      FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id
      JOIN profiles p ON p.user_id=c.host_id JOIN host_profiles h ON h.user_id=c.host_id
      WHERE b.guest_id=$1 ORDER BY s.starts_at,b.id LIMIT $2 OFFSET $3`,
            [actor, limit, offset],
          );
    const sections: Record<string, unknown[]> = {
      upcoming: [],
      past: [],
      cancelled: [],
    };
    for (const row of rows) {
      if (view === "host")
        row.remainingPlaces = row.capacity - row.confirmedPlaces;
      sections[mealSection(row.status ?? "accepted", row.startsAt)].push(row);
    }
    return { isHost, sections, limit, offset };
  }
  async allergyConsent(actor: string, booking: string, consent?: boolean) {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT b.status,p.details FROM bookings b JOIN profiles p ON p.user_id=b.guest_id WHERE b.id=$1 AND b.guest_id=$2 FOR UPDATE OF b FOR SHARE OF p`,
        [booking, actor],
      );
      if (!rows.length) throw new AuthError(404, "not_found");
      if (consent === true) {
        if (!["pending", "accepted"].includes(rows[0].status))
          throw new AuthError(409, "inactive_booking");
        if (!rows[0].details.consent)
          throw new AuthError(409, "profile_consent_required");
        await client.query(
          `INSERT INTO booking_allergy_consents(booking_id,allergies) VALUES($1,$2) ON CONFLICT(booking_id) DO UPDATE SET allergies=excluded.allergies,granted_at=now()`,
          [booking, rows[0].details.allergies],
        );
      } else if (consent === false)
        await client.query(
          "DELETE FROM booking_allergy_consents WHERE booking_id=$1",
          [booking],
        );
      const result = await client.query(
        'SELECT allergies,granted_at AS "grantedAt" FROM booking_allergy_consents WHERE booking_id=$1',
        [booking],
      );
      await client.query("COMMIT");
      return { consent: result.rows[0] ?? null };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async sharedAllergies(actor: string, booking: string) {
    const { rows } = await this.db.query(
      `SELECT CASE WHEN b.status='accepted' AND p.details->>'consent'='true' AND p.details->'allergies'=to_jsonb(a.allergies) THEN a.allergies END AS allergies
      FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id
      JOIN profiles p ON p.user_id=b.guest_id LEFT JOIN booking_allergy_consents a ON a.booking_id=b.id
      WHERE b.id=$1 AND c.host_id=$2`,
      [booking, actor],
    );
    if (!rows.length) throw new AuthError(404, "not_found");
    return rows[0];
  }
}

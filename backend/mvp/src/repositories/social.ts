import type pg from "pg";
import { AuthError } from "../services/auth.js";
export class SocialRepository {
  constructor(private db: pg.Pool) {}
  async conversations(me: string) {
    return (
      await this.db.query(
        `WITH latest AS (SELECT DISTINCT ON (peer) CASE WHEN sender_id=$1 THEN recipient_id ELSE sender_id END AS peer,id,body FROM messages WHERE $1 IN(sender_id,recipient_id) ORDER BY peer,id DESC) SELECT peer AS "peerId",p.details->>'firstName' AS "firstName",body AS preview FROM latest JOIN profiles p ON p.user_id=peer ORDER BY id DESC`,
        [me],
      )
    ).rows;
  }
  async peer(me: string, id: string) {
    if (
      me === id ||
      !(await this.db.query("SELECT 1 FROM profiles WHERE user_id=$1", [id]))
        .rowCount
    )
      throw new AuthError(404, "not_found");
  }
  async thread(me: string, peer: string) {
    await this.peer(me, peer);
    return (
      await this.db.query(
        'SELECT id,sender_id AS "senderId",created_at AS "createdAt",body FROM messages WHERE (sender_id=$1 AND recipient_id=$2) OR (sender_id=$2 AND recipient_id=$1) ORDER BY id',
        [me, peer],
      )
    ).rows;
  }
  async send(me: string, peer: string, body: string) {
    await this.peer(me, peer);
    const r = await this.db.query(
      "INSERT INTO messages(sender_id,recipient_id,body) SELECT user_id,$2,$3 FROM profiles WHERE user_id=$1 RETURNING id",
      [me, peer, body],
    );
    if (!r.rowCount) throw new AuthError(409, "profile_required");
    return r.rows[0];
  }
  async review(me: string, id: string, rating: number, comment: string) {
    const { rows } = await this.db.query(
      `WITH eligible AS (SELECT b.status,CASE WHEN b.guest_id=$1 THEN c.host_id ELSE b.guest_id END AS subject FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id WHERE b.id=$2 AND $1 IN(b.guest_id,c.host_id)), inserted AS (INSERT INTO reviews(booking_id,author_id,subject_id,rating,comment) SELECT $2,$1,subject,$3,$4 FROM eligible WHERE status='completed' ON CONFLICT DO NOTHING RETURNING rating) SELECT status,(SELECT rating FROM inserted) AS rating FROM eligible`,
      [me, id, rating, comment],
    );
    if (!rows.length) throw new AuthError(404, "not_found");
    if (!rows[0].rating)
      throw new AuthError(409, "completed_unique_review_required");
    return { rating, comment };
  }
  async personal(me: string) {
    return (
      await this.db.query(
        `SELECT u.id,u.email,u.created_at AS "createdAt",p.details AS profile,p.consented_at AS "consentedAt",p.is_verified AS "isVerified",EXISTS(SELECT 1 FROM host_profiles WHERE user_id=u.id) AS "isHost",ARRAY(SELECT to_jsonb(c) || jsonb_build_object('slots',ARRAY(SELECT to_jsonb(s) FROM context_slots s WHERE s.context_id=c.id)) FROM contexts c WHERE c.host_id=u.id) AS contexts,ARRAY(SELECT to_jsonb(b) FROM bookings b WHERE b.guest_id=u.id) AS bookings,ARRAY(SELECT to_jsonb(e) FROM booking_status_events e WHERE e.actor_id=u.id) AS events,ARRAY(SELECT to_jsonb(m) FROM messages m WHERE m.sender_id=u.id) AS messages,ARRAY(SELECT to_jsonb(r) FROM reviews r WHERE r.author_id=u.id) AS reviews FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=$1`,
        [me],
      )
    ).rows[0];
  }
  async erase(me: string) {
    await this.db.query("DELETE FROM users WHERE id=$1", [me]);
  }
  async reviews(subject: string, sort: string, limit: number, offset: number) {
    if (
      !(
        await this.db.query("SELECT 1 FROM profiles WHERE user_id=$1", [
          subject,
        ])
      ).rowCount
    )
      throw new AuthError(404, "not_found");
    return (
      await this.db.query(
        `
      SELECT p.details->>'firstName' AS "authorFirstName",r.rating,r.comment,r.created_at AS "createdAt"
      FROM reviews r JOIN profiles p ON p.user_id=r.author_id WHERE r.subject_id=$1
      ORDER BY CASE WHEN $2='highest' THEN r.rating END DESC,
        CASE WHEN $2='lowest' THEN r.rating END ASC,
        r.created_at DESC NULLS LAST,r.booking_id,r.author_id LIMIT $3 OFFSET $4`,
        [subject, sort, limit, offset],
      )
    ).rows;
  }
}

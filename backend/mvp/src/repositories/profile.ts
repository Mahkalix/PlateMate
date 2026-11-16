import type pg from "pg";
import {
  completeness,
  profileInput,
  type Profile,
} from "../services/profile.js";
import { AuthError } from "../services/auth.js";
export class ProfileRepository {
  constructor(private db: pg.Pool) {}
  async get(userId: string) {
    return (await this.owner(userId)).profile;
  }
  async owner(userId: string) {
    const result = await this.db.query(
      "SELECT details,is_verified FROM profiles WHERE user_id=$1",
      [userId],
    );
    const row = result.rows[0];
    if (!row) return { profile: null };
    const p: Profile = row.details;
    return {
      profile: p,
      badges: {
        isVerified: row.is_verified,
        completeness: completeness(p),
      },
    };
  }
  async save(
    userId: string,
    details: Profile | Partial<Profile>,
    partial = false,
  ) {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        userId,
      ]);
      const previous = (
        await client.query(
          "SELECT details FROM profiles WHERE user_id=$1 FOR UPDATE",
          [userId],
        )
      ).rows[0]?.details;
      if (partial && !previous) throw new AuthError(409, "profile_required");
      const next = profileInput.parse(
        partial ? { ...previous, ...details } : details,
      );
      await client.query(
        "INSERT INTO profiles(user_id,details,consented_at) VALUES($1,$2,CASE WHEN $3::boolean THEN now() END) ON CONFLICT(user_id) DO UPDATE SET details=excluded.details, consented_at=CASE WHEN excluded.consented_at IS NOT NULL THEN coalesce(profiles.consented_at,excluded.consented_at) END",
        [userId, next, next.consent],
      );
      if (
        !next.consent ||
        JSON.stringify(previous?.allergies) !== JSON.stringify(next.allergies)
      ) {
        await client.query(
          "DELETE FROM booking_allergy_consents WHERE booking_id IN (SELECT id FROM bookings WHERE guest_id=$1)",
          [userId],
        );
      }
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

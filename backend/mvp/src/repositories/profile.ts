import type pg from "pg";
import type { Profile } from "../services/profile.js";
export class ProfileRepository {
  constructor(private db: pg.Pool) {}
  async get(userId: string) {
    const result = await this.db.query(
      "SELECT details FROM profiles WHERE user_id=$1",
      [userId],
    );
    return result.rows[0]?.details ?? null;
  }
  async save(userId: string, details: Profile) {
    await this.db.query(
      "INSERT INTO profiles(user_id,details,consented_at) VALUES($1,$2,CASE WHEN $3::boolean THEN now() END) ON CONFLICT(user_id) DO UPDATE SET details=excluded.details, consented_at=CASE WHEN excluded.consented_at IS NOT NULL THEN coalesce(profiles.consented_at,excluded.consented_at) END",
      [userId, details, details.consent],
    );
  }
}

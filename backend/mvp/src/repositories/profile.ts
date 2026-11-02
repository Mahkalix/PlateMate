import type pg from "pg";
import { completeness, type Profile } from "../services/profile.js";
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
  async save(userId: string, details: Profile) {
    await this.db.query(
      "INSERT INTO profiles(user_id,details,consented_at) VALUES($1,$2,CASE WHEN $3::boolean THEN now() END) ON CONFLICT(user_id) DO UPDATE SET details=excluded.details, consented_at=CASE WHEN excluded.consented_at IS NOT NULL THEN coalesce(profiles.consented_at,excluded.consented_at) END",
      [userId, details, details.consent],
    );
  }
}

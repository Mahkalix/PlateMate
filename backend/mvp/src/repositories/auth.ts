import type pg from "pg";
export class AuthRepository {
  constructor(private db: pg.Pool) {}
  async register(email: string, hash: string) {
    return (
      await this.db.query(
        "INSERT INTO users(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO NOTHING RETURNING id,email",
        [email, hash],
      )
    ).rows[0];
  }
  async credentials(email: string) {
    return (
      await this.db.query("SELECT id,password_hash FROM users WHERE email=$1", [
        email,
      ])
    ).rows[0];
  }
  async start(userId: string, hash: string) {
    return (
      await this.db.query(
        "INSERT INTO sessions(user_id,refresh_hash) VALUES($1,$2) RETURNING id,user_id",
        [userId, hash],
      )
    ).rows[0];
  }
  async rotate(oldHash: string, newHash: string) {
    return (
      await this.db.query(
        "UPDATE sessions SET refresh_hash=$2 WHERE refresh_hash=$1 AND expires_at>now() RETURNING id,user_id",
        [oldHash, newHash],
      )
    ).rows[0];
  }
  async identity(sessionId: string, userId: string) {
    return (
      await this.db.query(
        "SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND u.id=$2 AND s.expires_at>now()",
        [sessionId, userId],
      )
    ).rows[0];
  }
  async end(sessionId: string) {
    await this.db.query("DELETE FROM sessions WHERE id=$1", [sessionId]);
  }
}

import type pg from "pg";
export class AuthRepository {
  constructor(private db: pg.Pool) {}
  async identify(identity: { issuer: string; subject: string; email: string }) {
    try {
      const result = await this.db.query(
        `INSERT INTO users(auth_issuer,auth_subject,email) VALUES($1,$2,$3)
         ON CONFLICT(auth_issuer,auth_subject) DO UPDATE SET email=excluded.email RETURNING id`,
        [identity.issuer, identity.subject, identity.email],
      );
      return result.rows[0];
    } catch (error) {
      if ((error as { constraint?: string }).constraint === "users_email_key")
        return null;
      throw error;
    }
  }
  async start(userId: string, hash: string) {
    await this.db.query(
      "INSERT INTO sessions(user_id,refresh_hash) VALUES($1,$2)",
      [userId, hash],
    );
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

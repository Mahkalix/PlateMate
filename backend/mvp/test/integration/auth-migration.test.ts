import { readFile } from "node:fs/promises";
import { it, expect } from "vitest";
import { pool } from "../../src/pool.js";

it("US01 / Connexion : la migration conserve l’UUID historique, retire les mots de passe et révoque les sessions", async () => {
  const db = await pool.connect();
  const migration = (file: string) =>
    readFile(new URL("../../sql/" + file, import.meta.url), "utf8");
  try {
    await db.query("BEGIN");
    await db.query("CREATE SCHEMA auth0_upgrade_test");
    await db.query("SET LOCAL search_path=auth0_upgrade_test");
    await db.query(await migration("001_users.sql"));
    await db.query(await migration("002_sessions.sql"));
    const id = (
      await db.query(
        "INSERT INTO users(email,password_hash) VALUES('legacy@example.org','old-hash') RETURNING id",
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO sessions(user_id,refresh_hash) VALUES($1,'old-session')",
      [id],
    );
    await db.query(await migration("011_auth0.sql"));
    const user = (await db.query("SELECT * FROM users WHERE id=$1", [id]))
      .rows[0];
    expect(user).toMatchObject({
      id,
      email: "legacy@example.org",
      auth_subject: null,
      auth_issuer: null,
    });
    expect(user).not.toHaveProperty("password_hash");
    expect(
      (await db.query("SELECT count(*)::int AS n FROM sessions")).rows[0].n,
    ).toBe(0);
  } finally {
    await db.query("ROLLBACK");
    db.release();
  }
});

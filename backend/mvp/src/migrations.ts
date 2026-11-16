import type pg from "pg";
import { readdir, readFile } from "node:fs/promises";
const directory = new URL("../sql/", import.meta.url);
export async function migrate(db: pg.Pool) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(7341801)");
    await client.query("CREATE SCHEMA IF NOT EXISTS platemate_mvp");
    await client.query("SET LOCAL search_path=platemate_mvp");
    await client.query(
      "CREATE TABLE IF NOT EXISTS migrations(name text PRIMARY KEY)",
    );
    for (const name of (await readdir(directory))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      if (
        (await client.query("SELECT 1 FROM migrations WHERE name=$1", [name]))
          .rowCount
      )
        continue;
      await client.query(await readFile(new URL(name, directory), "utf8"));
      await client.query("INSERT INTO migrations VALUES($1)", [name]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

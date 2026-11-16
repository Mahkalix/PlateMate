import pg from "pg";
import { testDatabase } from "../src/config.js";
import { migrate } from "../src/migrations.js";
export default async function setup() {
  const connectionString = testDatabase(
    process.env.TEST_DATABASE_URL ??
      "postgres://platemate:platemate@localhost:5433/platemate_test",
  );
  const db = new pg.Pool({
    connectionString,
    options: "-c search_path=platemate_mvp",
  });
  try {
    await db.query("DROP SCHEMA IF EXISTS platemate_mvp CASCADE");
    await migrate(db);
  } finally {
    await db.end();
  }
}

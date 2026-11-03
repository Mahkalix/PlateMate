import { it } from "vitest";
import request from "supertest";
import pg from "pg";
import { createApp } from "../../src/app.js";
it("S0 / SANS ÉCRAN : base injoignable donne 503", async () => {
  const db = new pg.Pool({
    connectionString: "postgres://test@127.0.0.1:1/platemate_test",
    connectionTimeoutMillis: 500,
  });
  try {
    await request(createApp(db))
      .get("/health")
      .expect(503, { error: "database_unavailable" });
  } finally {
    await db.end();
  }
});

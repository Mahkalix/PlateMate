import request from "supertest";
import { expect, it } from "vitest";
import { app } from "../../src/app.js";
it("S0 / SANS ÉCRAN : PostgreSQL prêt donne 200", async () => {
  await request(app).get("/health").expect(200, { status: "ready" });
});
it("S0 / SANS ÉCRAN : route inconnue", async () => {
  const res = await request(app).get("/unknown");
  expect(res.status).toBe(404);
});

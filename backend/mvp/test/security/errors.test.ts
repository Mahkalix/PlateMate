import request from "supertest";
import { expect, it } from "vitest";
import { app } from "../../src/app.js";
it("S0 / SANS ÉCRAN : erreur JSON sans détails internes", async () => {
  const r = await request(app).post("/invalid").type("json").send("{");
  expect(r.status).toBe(400);
  expect(r.body).toEqual({ error: "invalid_json" });
});

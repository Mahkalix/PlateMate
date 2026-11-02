import { it, expect } from "vitest";
import { client, credentials, signedIn } from "../auth-fixture.js";
import { pool } from "../../src/pool.js";
it("US01 / Connexion : crée un compte, normalise l’email et conserve uniquement un hash", async () => {
  const r = await client().post("/auth/register").send(credentials).expect(201);
  expect(r.body).toEqual({ id: expect.any(String), email: "mika@example.org" });
  const row = (await pool.query("select password_hash from users")).rows[0];
  expect(row.password_hash).toMatch(/^\$2[aby]\$/);
});
it("US01 / Connexion : email en double avec casse différente", async () => {
  const api = client();
  await api.post("/auth/register").send(credentials).expect(201);
  await api
    .post("/auth/register")
    .send({ ...credentials, email: "mika@example.org" })
    .expect(409);
});
it.each([
  { email: "invalid" },
  { password: "short" },
  { password: "é".repeat(40) },
])("US01 / Connexion : entrée invalide %o", async (invalid) => {
  await client()
    .post("/auth/register")
    .send({ ...credentials, ...invalid })
    .expect(422);
});
it("US01 / Connexion : même erreur pour mot de passe incorrect et compte absent", async () => {
  const api = client();
  await api.post("/auth/register").send(credentials);
  const a = await api
    .post("/auth/login")
    .send({ ...credentials, password: "wrong" })
    .expect(401);
  const b = await api
    .post("/auth/login")
    .send({ ...credentials, email: "other@example.org" })
    .expect(401);
  expect(a.body).toEqual(b.body);
});
it("US02 / Connexion : identité reconnue, cookie privé et rotation à usage unique", async () => {
  const api = client();
  const s = await signedIn(api);
  const me = await api
    .get("/me")
    .set("Authorization", "Bearer " + s.access)
    .expect(200);
  expect(me.body).toEqual({
    email: "mika@example.org",
    id: expect.any(String),
  });
  const r = await api.post("/auth/refresh").set("Cookie", s.cookie).expect(200);
  expect(r.body).toEqual({ accessToken: expect.any(String) });
  expect(r.headers["set-cookie"][0]).toMatch(/HttpOnly/i);
  expect(r.headers["set-cookie"][0]).toMatch(/SameSite=Strict/i);
  await api
    .get("/me")
    .set("Authorization", "Bearer " + r.body.accessToken)
    .expect(200);
  await api.post("/auth/refresh").set("Cookie", s.cookie).expect(401);
});
it("US01 / SANS ÉCRAN déconnexion : access et refresh révoqués", async () => {
  const api = client();
  const s = await signedIn(api);
  await api
    .post("/auth/logout")
    .set("Authorization", "Bearer " + s.access)
    .expect(204);
  await api
    .get("/me")
    .set("Authorization", "Bearer " + s.access)
    .expect(401);
  await api.post("/auth/refresh").set("Cookie", s.cookie).expect(401);
});

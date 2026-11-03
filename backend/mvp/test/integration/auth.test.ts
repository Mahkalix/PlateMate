import { it, expect } from "vitest";
import { client, signedIn, tenant } from "../auth-fixture.js";
import { pool } from "../../src/pool.js";

it.each([
  ["login", false],
  ["register", true],
] as const)(
  "US01 / Connexion : %s ouvre Universal Login avec la connexion email et PKCE",
  async (path, signup) => {
    const r = await client()
      .get("/auth/" + path)
      .expect(302);
    const url = new URL(r.headers.location);
    expect(url.origin + "/").toBe(tenant.issuer);
    const params = Object.fromEntries(url.searchParams);
    expect(params).toMatchObject({
      client_id: "test-web",
      connection: "Username-Password-Authentication",
      response_type: "code",
      scope: "openid email",
      redirect_uri: "http://localhost:3001/auth/callback",
      code_challenge_method: "S256",
      state: expect.any(String),
      nonce: expect.any(String),
      code_challenge: expect.any(String),
    });
    expect(params.screen_hint).toBe(signup ? "signup" : undefined);
    expect(r.headers["set-cookie"][0]).toMatch(/HttpOnly/i);
    expect(r.headers["set-cookie"][0]).toMatch(/SameSite=Lax/i);
  },
);
it("US01 / Connexion : PlateMate ne reçoit plus le mot de passe", async () => {
  for (const path of ["/auth/register", "/auth/login"])
    await client()
      .post(path)
      .send({ email: "me@example.org", password: "secret" })
      .expect(404);
  expect(
    (await pool.query("select count(*)::int as count from users")).rows[0]
      .count,
  ).toBe(0);
});
it("US01 / Connexion : deux connexions du même sujet conservent le compte et le profil", async () => {
  const api = client();
  const a = await signedIn(api);
  const b = await signedIn(api);
  expect(a.id).toEqual(b.id);
  await api
    .get("/me")
    .set("Authorization", "Bearer " + b.access)
    .expect(200, { id: a.id, email: "mika@example.org" });
});
it("US01 / Connexion : ne fusionne jamais un compte existant sur la seule adresse email", async () => {
  const api = client();
  const existing = (
    await pool.query(
      "INSERT INTO users(email) VALUES('mika@example.org') RETURNING id",
    )
  ).rows[0];
  const start = await api.get("/auth/login").expect(302);
  await api
    .get(tenant.approve(start.headers.location))
    .set("Cookie", start.headers["set-cookie"][0].split(";")[0])
    .expect(409, { error: "account_link_required" });
  expect((await pool.query("SELECT id,auth_subject FROM users")).rows).toEqual([
    { ...existing, auth_subject: null },
  ]);
});
it("US02 / Connexion : rotation du refresh et révocation immédiate à la déconnexion", async () => {
  const api = client();
  const s = await signedIn(api);
  const r = await api.post("/auth/refresh").set("Cookie", s.cookie).expect(200);
  expect(r.headers["set-cookie"][0]).toMatch(/HttpOnly/i);
  expect(r.headers["set-cookie"][0]).toMatch(/SameSite=Strict/i);
  await api.post("/auth/refresh").set("Cookie", s.cookie).expect(401);
  await api
    .get("/me")
    .set("Authorization", "Bearer " + r.body.accessToken)
    .expect(200);
  await api
    .post("/auth/logout")
    .set("Authorization", "Bearer " + r.body.accessToken)
    .expect(204);
  await api
    .get("/me")
    .set("Authorization", "Bearer " + s.access)
    .expect(401);
  await api
    .post("/auth/refresh")
    .set("Cookie", r.headers["set-cookie"][0].split(";")[0])
    .expect(401);
});

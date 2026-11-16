import { it, expect } from "vitest";
import { pool } from "../../src/pool.js";
import { client, tenant } from "../auth-fixture.js";

it.each([
  "issuer",
  "audience",
  "expired",
  "nonce",
  "signature",
  "unverified",
  "social",
  "subject",
  "email",
  "state",
  "no-cookie",
  "tampered-cookie",
  "denied",
  "pkce",
])(
  "US01 / Connexion : le callback refuse %s sans créer de compte",
  async (fault) => {
    const api = client();
    const start = await api.get("/auth/login").expect(302);
    const location = new URL(start.headers.location);
    if (fault === "pkce")
      location.searchParams.set("code_challenge", "incorrect");
    const user = {
      email_verified: fault !== "unverified",
      sub:
        fault === "social"
          ? "google-oauth2|123"
          : fault === "subject"
            ? "auth0|"
            : "auth0|123",
      email: fault === "email" ? "invalid" : "mika@example.org",
    };
    const callback = new URL(
      tenant.approve(location.href, user.email, user, fault),
      "http://localhost",
    );
    if (fault === "state") callback.searchParams.set("state", "bad-state");
    if (fault === "denied") {
      callback.searchParams.delete("code");
      callback.searchParams.set("error", "access_denied");
    }
    const req = api.get(callback.pathname + callback.search);
    const cookie = start.headers["set-cookie"][0].split(";")[0];
    if (fault !== "no-cookie")
      req.set(
        "Cookie",
        fault === "tampered-cookie" ? cookie + "tampered" : cookie,
      );
    const r = await req.expect(401, { error: "invalid_login" });
    expect(String(r.headers["set-cookie"])).not.toContain("refresh=");
    expect(
      (await pool.query("SELECT count(*)::int AS n FROM users")).rows[0].n,
    ).toBe(0);
  },
);
it("US01 / Connexion : le même code ne permet pas d’ouvrir une deuxième session", async () => {
  const api = client();
  const start = await api.get("/auth/login").expect(302);
  const callback = tenant.approve(start.headers.location);
  const cookie = start.headers["set-cookie"][0].split(";")[0];
  const completed = await api.get(callback).set("Cookie", cookie).expect(303);
  expect(completed.headers.location).toBe("http://localhost:8080");
  expect(completed.body.accessToken).toBeUndefined();
  await api.get(callback).set("Cookie", cookie).expect(401);
  expect(
    (await pool.query("SELECT count(*)::int AS n FROM sessions")).rows[0].n,
  ).toBe(1);
});

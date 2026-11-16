import { it, expect } from "vitest";
import { SignJWT, decodeJwt } from "jose";
import { client, signedIn } from "../auth-fixture.js";
for (const path of ["/me", "/auth/logout"]) {
  for (const mode of ["absent", "expiré", "falsifié"])
    it(
      "US02 / Connexion : " + path + " renvoie 401 avec jeton " + mode,
      async () => {
        const api = client();
        let token: string | undefined;
        if (mode !== "absent") {
          const { access } = await signedIn(api);
          const payload = decodeJwt(access);
          const key = new TextEncoder().encode(
            mode === "expiré" ? process.env.JWT_SECRET : "different-key",
          );
          token = await new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(mode === "expiré" ? 1 : "10m")
            .sign(key);
        }
        const r = path === "/me" ? api.get(path) : api.post(path);
        if (token) r.set("Authorization", "Bearer " + token);
        await r.expect(401);
      },
    );
}
it("US02 / SANS ÉCRAN : refresh manquant ou inconnu refusé", async () => {
  const api = client();
  await api.post("/auth/refresh").expect(401);
  await api.post("/auth/refresh").set("Cookie", "refresh=unknown").expect(401);
});
it("US01 / Connexion : la 11e tentative est limitée", async () => {
  const api = client();
  for (let i = 0; i < 10; i++) await api.get("/auth/login").expect(302);
  const r = await api.get("/auth/login").expect(429);
  expect(r.headers["retry-after"]).toBeDefined();
});

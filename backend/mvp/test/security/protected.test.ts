import { it, expect } from "vitest";
import { SignJWT } from "jose";
import { client } from "../auth-fixture.js";
const id = "00000000-0000-4000-8000-000000000001";
const routes = [
  ["get", "/explorer"],
  ["get", "/profiles/" + id + "/contexts/" + id],
  ["get", "/me/profile"],
  ["put", "/me/profile"],
] as const;
for (const [method, path] of routes)
  it(
    "US02 / Session : " +
      method +
      " " +
      path +
      " refuse token absent, expiré et falsifié",
    async () => {
      const api = client();
      for (const mode of ["absent", "expiré", "falsifié"]) {
        const key = new TextEncoder().encode(
          mode === "expiré" ? process.env.JWT_SECRET : "invalid-signing-key",
        );
        const jwt = await new SignJWT({ sid: id })
          .setSubject(id)
          .setAudience("matching")
          .setIssuer("platemate")
          .setExpirationTime(mode === "expiré" ? 1 : "10m")
          .setProtectedHeader({ alg: "HS256" })
          .sign(key);
        const r = api[method](path);
        if (mode !== "absent") r.set("Authorization", "Bearer " + jwt);
        const response = await r.expect(401);
        expect(response.body.error).toBe("invalid_session");
      }
    },
  );

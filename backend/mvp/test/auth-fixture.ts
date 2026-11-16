import request from "supertest";
import { beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createApp } from "../src/app.js";
import { pool } from "../src/pool.js";
import { startIssuer } from "./oidc-provider.js";

export let tenant: Awaited<ReturnType<typeof startIssuer>>;
beforeAll(async () => {
  tenant = await startIssuer();
});
beforeEach(() => vi.stubEnv("AUTH0_ISSUER_BASE_URL", tenant.issuer));
afterAll(async () => {
  await tenant.close();
  vi.unstubAllEnvs();
});
export function client() {
  return request(createApp(pool));
}
export async function signedIn(
  api: ReturnType<typeof client>,
  email = "mika@example.org",
) {
  const start = await api.get("/auth/login").expect(302);
  const callback = tenant.approve(start.headers.location, email);
  const response = await api
    .get(callback)
    .set("Cookie", start.headers["set-cookie"][0].split(";")[0])
    .expect(303);
  const sessionCookie = Array.from(
    response.headers["set-cookie"] as unknown as string[],
  ).find((c) => c.startsWith("refresh="))!;
  const tokens = await api
    .post("/auth/refresh")
    .set("Cookie", sessionCookie.split(";")[0])
    .expect(200);
  const access = tokens.body.accessToken as string;
  const { body } = await api
    .get("/me")
    .set("Authorization", "Bearer " + access)
    .expect(200);
  return {
    id: body.id as string,
    access,
    cookie: tokens.headers["set-cookie"][0].split(";")[0],
  };
}

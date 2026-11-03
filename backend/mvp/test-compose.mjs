import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startIssuer } from "./test/oidc-provider.ts";
const base = "http://127.0.0.1:3001";
const tenant = await startIssuer(49080);
try {
  const health = await fetch(base + "/health");
  assert.deepEqual(await health.json(), { status: "ready" });
  const start = await fetch(base + "/auth/login", { redirect: "manual" });
  assert.equal(start.status, 302);
  const email = randomUUID() + "@example.invalid";
  const path = tenant.approve(start.headers.get("location"), email);
  const callback = await fetch(base + path, {
    redirect: "manual",
    headers: { cookie: start.headers.getSetCookie()[0].split(";")[0] },
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get("location"), "http://localhost:8080");
  const refresh = callback.headers
    .getSetCookie()
    .find((c) => c.startsWith("refresh="))
    .split(";")[0];
  const session = await fetch(base + "/auth/refresh", {
    method: "POST",
    headers: { cookie: refresh },
  });
  assert.equal(session.status, 200);
  const { accessToken } = await session.json();
  const headers = {
    authorization: "Bearer " + accessToken,
    "content-type": "application/json",
  };
  const me = await fetch(base + "/me", { headers });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).email, email);
  const removed = await fetch(base + "/me/account", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ confirm: true }),
  });
  assert.equal(removed.status, 204);
  assert.equal((await fetch(base + "/me", { headers })).status, 401);
  console.log(
    "Docker HTTP OK: health, OIDC PKCE callback, identity, deletion and revocation (test issuer).",
  );
} finally {
  await tenant.close();
}

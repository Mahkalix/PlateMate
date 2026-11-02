// Run against a completely started Compose stack, through the published HTTP port.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.SMOKE_API_URL ?? "http://127.0.0.1:3001";
const credentials = { email: `docker-${randomUUID()}@example.invalid`, password: randomUUID() };
async function call(path, status, method = "GET", body, token) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, status, `${method} ${path}: HTTP ${response.status}`);
  return status === 204 ? null : response.json();
}
assert.deepEqual(await call("/health", 200), { status: "ready" });
const account = await call("/auth/register", 201, "POST", credentials);
const { accessToken } = await call("/auth/login", 200, "POST", credentials);
try {
  assert.deepEqual(await call("/me", 200, "GET", undefined, accessToken), account);
} finally {
  await call("/me/account", 204, "DELETE", { confirm: true }, accessToken);
}
await call("/me", 401, "GET", undefined, accessToken);
console.log("Docker HTTP OK: health, register, login, identity, deletion and revocation.");

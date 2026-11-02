import request from "supertest";
import { createApp } from "../src/app.js";
import { pool } from "../src/pool.js";
export const credentials = {
  email: "Mika@Example.org",
  password: "Unique-passphrase-231!",
};
export function client() {
  return request(createApp(pool));
}
export async function signedIn(api: ReturnType<typeof client>) {
  await api.post("/auth/register").send(credentials).expect(201);
  const r = await api.post("/auth/login").send(credentials).expect(200);
  return {
    access: r.body.accessToken as string,
    cookie: String(r.headers["set-cookie"][0]).split(";")[0],
  };
}

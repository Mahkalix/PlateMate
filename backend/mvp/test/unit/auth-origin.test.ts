import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authController } from "../../src/controllers/auth.js";
import type { AuthService } from "../../src/services/auth.js";
import type { Auth0Login } from "../../src/services/auth0.js";

afterEach(() => vi.unstubAllEnvs());
describe("preview login origin", () => {
  function setup() {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("AUTH0_CALLBACK_URL", "https://stable.example/auth/callback");
    const start = vi.fn().mockResolvedValue({ url: "https://identity.example/authorize", attempt: "signed-attempt" });
    const controller = authController({} as AuthService, { start } as unknown as Auth0Login);
    const app = express();
    app.get("/auth/login", controller.login);
    app.get("/auth/register", controller.register);
    return { app, start };
  }
  it.each(["login", "register"])("moves %s to the callback host before setting a cookie", async (route) => {
    const { app, start } = setup();
    const response = await request(app).get("/auth/" + route).set("Host", "preview.example");
    expect(response.status).toBe(303);
    expect(response.headers.location).toBe("https://stable.example/auth/" + route);
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(start).not.toHaveBeenCalled();
  });
  it("starts OAuth and sets its cookie on the canonical host", async () => {
    const { app, start } = setup();
    const response = await request(app).get("/auth/login").set("Host", "stable.example");
    expect(response.status).toBe(302);
    expect(start).toHaveBeenCalledWith(false);
    expect(response.headers.location).toBe("https://identity.example/authorize");
    expect(response.headers["set-cookie"][0]).toContain("oidc_attempt=");
  });
  it("keeps local Docker login unchanged", async () => {
    const { app, start } = setup();
    vi.stubEnv("VERCEL", "");
    await request(app).get("/auth/login").set("Host", "localhost:8080");
    expect(start).toHaveBeenCalledWith(false);
  });
});

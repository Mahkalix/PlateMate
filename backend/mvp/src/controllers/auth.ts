import type { RequestHandler, Response } from "express";
import { AuthService } from "../services/auth.js";
const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth/refresh",
};
export function authController(service: AuthService) {
  function sendTokens(
    res: Response,
    tokens: { refresh: string; accessToken: string },
  ) {
    res
      .set("Cache-Control", "no-store")
      .cookie("refresh", tokens.refresh, { ...cookie, maxAge: 7 * 86400000 })
      .json({ accessToken: tokens.accessToken });
  }
  const authenticated: RequestHandler = async (req, res, next) => {
    res.locals.identity = await service.authenticate(req.get("authorization"));
    next();
  };
  const register: RequestHandler = async (req, res) => {
    res.status(201).json(await service.register(req.body));
  };
  const login: RequestHandler = async (req, res) => {
    sendTokens(res, await service.login(req.body));
  };
  const refresh: RequestHandler = async (req, res) => {
    const token =
      req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("refresh="))
        ?.slice(8) ?? "";
    sendTokens(res, await service.refresh(token));
  };
  const me: RequestHandler = (_req, res) => {
    res.set("Cache-Control", "no-store").json(res.locals.identity.user);
  };
  const logout: RequestHandler = async (_req, res) => {
    await service.logout(res.locals.identity.sessionId);
    res.clearCookie("refresh", cookie).sendStatus(204);
  };
  return { authenticated, register, login, refresh, me, logout };
}

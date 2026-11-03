import type { RequestHandler, Response } from "express";
import { AuthService } from "../services/auth.js";
import { Auth0Login } from "../services/auth0.js";
const flowCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/callback",
};
function readCookie(header: string | undefined, name: string) {
  return (
    header
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(name + "="))
      ?.slice(name.length + 1) ?? ""
  );
}
const cookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/auth/refresh",
};
export function authController(service: AuthService, provider: Auth0Login) {
  function setRefresh(res: Response, refresh: string) {
    res.cookie("refresh", refresh, { ...cookie, maxAge: 7 * 86400000 });
  }
  function sendTokens(
    res: Response,
    tokens: { refresh: string; accessToken: string },
  ) {
    setRefresh(res, tokens.refresh);
    res
      .set("Cache-Control", "no-store")
      .json({ accessToken: tokens.accessToken });
  }
  const authenticated: RequestHandler = async (req, res, next) => {
    res.locals.identity = await service.authenticate(req.get("authorization"));
    res.set("Cache-Control", "no-store");
    next();
  };
  function start(signup: boolean): RequestHandler {
    return async (_req, res) => {
      const { url, attempt } = await provider.start(signup);
      res
        .set("Cache-Control", "no-store")
        .cookie("oidc_attempt", attempt, { ...flowCookie, maxAge: 300_000 })
        .redirect(url);
    };
  }
  const callback: RequestHandler = async (req, res) => {
    res
      .set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" })
      .clearCookie("oidc_attempt", flowCookie);
    const identity = await provider.finish(
      req.originalUrl,
      readCookie(req.headers.cookie, "oidc_attempt"),
    );
    setRefresh(res, await service.login(identity));
    res.redirect(303, provider.appOrigin);
  };
  const refresh: RequestHandler = async (req, res) => {
    sendTokens(
      res,
      await service.refresh(readCookie(req.headers.cookie, "refresh")),
    );
  };
  const me: RequestHandler = (_req, res) => {
    res.set("Cache-Control", "no-store").json(res.locals.identity.user);
  };
  const logout: RequestHandler = async (_req, res) => {
    await service.logout(res.locals.identity.sessionId);
    res.clearCookie("refresh", cookie).sendStatus(204);
  };
  return {
    authenticated,
    register: start(true),
    login: start(false),
    callback,
    refresh,
    me,
    logout,
  };
}

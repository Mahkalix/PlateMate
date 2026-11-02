import { Router } from "express";
import { hostController } from "../controllers/host.js";
import { explorerController } from "../controllers/explorer.js";
import { ExplorerRepository } from "../repositories/explorer.js";
import { profileController } from "../controllers/profile.js";
import { ProfileRepository } from "../repositories/profile.js";
import { rateLimit } from "express-rate-limit";
import type pg from "pg";
import { AuthRepository } from "../repositories/auth.js";
import { AuthService } from "../services/auth.js";
import { authController } from "../controllers/auth.js";
export function authRoutes(db: pg.Pool) {
  const router = Router();
  const c = authController(
    new AuthService(new AuthRepository(db), process.env.JWT_SECRET),
  );
  const limit = rateLimit({
    windowMs: 60000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "too_many_requests" },
  });
  router.use("/auth", limit);
  router.post("/auth/register", c.register);
  router.post("/auth/login", c.login);
  router.post("/auth/refresh", c.refresh);
  router.post("/auth/logout", c.authenticated, c.logout);
  router.get("/me", c.authenticated, c.me);
  const profile = profileController(new ProfileRepository(db));
  router
    .route("/me/profile")
    .all(c.authenticated)
    .get(profile.read)
    .put(profile.save);
  const explorer = explorerController(new ExplorerRepository(db));
  router.get("/explorer", c.authenticated, explorer.list);
  router.get(
    "/profiles/:host/contexts/:context",
    c.authenticated,
    explorer.detail,
  );
  const host = hostController(db);
  router.post("/me/host", c.authenticated, host.register);
  router.post("/me/contexts", c.authenticated, host.publish);
  return router;
}

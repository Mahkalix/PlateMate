import { Router } from "express";
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
  return router;
}

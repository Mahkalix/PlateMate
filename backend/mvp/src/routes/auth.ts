import { walletRoutes } from "./wallet.js";
import { Router } from "express";
import { socialController } from "../controllers/social.js";
import { SocialRepository } from "../repositories/social.js";
import { bookingController } from "../controllers/bookings.js";
import { Bookings } from "../repositories/bookings.js";
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
  const bookings = bookingController(new Bookings(db));
  router.get("/me/bookings", c.authenticated, bookings.list);
  router.get("/me/slots/:id/guests", c.authenticated, bookings.guests);
  router.post("/bookings", c.authenticated, bookings.create);
  router.patch("/bookings/:id/status", c.authenticated, bookings.update);
  router.post(
    "/bookings/:id/payment-intent",
    c.authenticated,
    bookings.payment,
  );
  const social = socialController(new SocialRepository(db));
  router.get("/conversations", c.authenticated, social.conversations);
  router
    .route("/conversations/:peer/messages")
    .all(c.authenticated)
    .get(social.thread)
    .post(social.send);
  router.post("/bookings/:id/review", c.authenticated, social.review);
  router.get("/profiles/:id/reviews", c.authenticated, social.reviews);
  router.get("/me/export", c.authenticated, social.personal);
  router.delete("/me/account", c.authenticated, social.erase);
  router.use(walletRoutes(db, c.authenticated));
  return router;
}

import express, { type ErrorRequestHandler } from "express";
import type pg from "pg";
import { pool } from "./pool.js";
import { authRoutes } from "./routes/auth.js";
import { AuthError } from "./services/auth.js";
import { ZodError } from "zod";
export function createApp(db: pg.Pool) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.on("finish", () =>
      console.info(
        JSON.stringify({ method: req.method, status: res.statusCode }),
      ),
    );
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  app.get("/health", async (_req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ error: "database_unavailable" });
    }
  });
  app.use(authRoutes(db));
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  const errors: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof AuthError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (err instanceof ZodError) {
      res.status(422).json({ error: "invalid_input" });
      return;
    }
    if (err.type === "entity.parse.failed")
      res.status(400).json({ error: "invalid_json" });
    else if (err.type === "entity.too.large")
      res.status(413).json({ error: "too_large" });
    else res.status(500).json({ error: "internal_error" });
  };
  app.use(errors);
  return app;
}
export const app = createApp(pool);

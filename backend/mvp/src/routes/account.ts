import { Router, type RequestHandler } from "express";
import { z } from "zod";
import type pg from "pg";
import { AccountRepository } from "../repositories/account.js";
import { tableInput } from "../services/account.js";
export function accountRoutes(db: pg.Pool, authenticated: RequestHandler) {
  const router = Router(),
    repo = new AccountRepository(db);
  router.get("/me/account-summary", authenticated, async (_req, res) => {
    res.json(await repo.summary(res.locals.identity.user.id));
  });
  router
    .route("/me/table")
    .all(authenticated)
    .get(async (_req, res) => {
      res.json(await repo.table(res.locals.identity.user.id));
    })
    .put(async (req, res) => {
      res.json(
        await repo.saveTable(
          res.locals.identity.user.id,
          tableInput.parse(req.body),
        ),
      );
    });
  router.get("/me/meals", authenticated, async (req, res) => {
    const query = z
      .object({
        view: z.enum(["host", "guest"]).default("guest"),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        offset: z.coerce.number().int().min(0).max(100000).default(0),
      })
      .strict()
      .parse(req.query);
    res.json(
      await repo.meals(
        res.locals.identity.user.id,
        query.view,
        query.limit,
        query.offset,
      ),
    );
  });
  router
    .route("/bookings/:id/allergy-consent")
    .all(authenticated)
    .get(async (req, res) => {
      res.json(
        await repo.allergyConsent(
          res.locals.identity.user.id,
          z.uuid().parse(req.params.id),
        ),
      );
    })
    .put(async (req, res) => {
      const { consent } = z
        .object({ consent: z.boolean() })
        .strict()
        .parse(req.body);
      res.json(
        await repo.allergyConsent(
          res.locals.identity.user.id,
          z.uuid().parse(req.params.id),
          consent,
        ),
      );
    });
  router.get(
    "/bookings/:id/shared-allergies",
    authenticated,
    async (req, res) => {
      res.json(
        await repo.sharedAllergies(
          res.locals.identity.user.id,
          z.uuid().parse(req.params.id),
        ),
      );
    },
  );
  return router;
}

import { z } from "zod";
import type { RequestHandler } from "express";
import { Bookings } from "../repositories/bookings.js";
import { statuses } from "../services/booking.js";
export function bookingController(repo: Bookings) {
  const create: RequestHandler = async (req, res) => {
    const p = z
      .object({ slotId: z.uuid(), partySize: z.number().int().min(1).max(100) })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await repo.create(res.locals.identity.user.id, p.slotId, p.partySize),
      );
  };
  const update: RequestHandler = async (req, res) => {
    const { status } = z
      .object({ status: z.enum(statuses) })
      .strict()
      .parse(req.body);
    res.json(
      await repo.transition(
        res.locals.identity.user.id,
        z.uuid().parse(req.params.id),
        status,
      ),
    );
  };
  const payment: RequestHandler = async (req, res) => {
    res.json(
      await repo.payment(
        res.locals.identity.user.id,
        z.uuid().parse(req.params.id),
      ),
    );
  };
  const list: RequestHandler = async (req, res) => {
    const view = z
      .enum(["host", "guest"])
      .default("guest")
      .parse(req.query.view);
    res.json({ items: await repo.list(res.locals.identity.user.id, view) });
  };
  const guests: RequestHandler = async (req, res) => {
    res.json(
      await repo.guests(
        res.locals.identity.user.id,
        z.uuid().parse(req.params.id),
      ),
    );
  };
  return { create, update, payment, list, guests };
}

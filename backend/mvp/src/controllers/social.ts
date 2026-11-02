import { z } from "zod";
import type { RequestHandler } from "express";
import { SocialRepository } from "../repositories/social.js";
export function socialController(repo: SocialRepository) {
  const conversations: RequestHandler = async (_req, res) => {
    res.json({ items: await repo.conversations(res.locals.identity.user.id) });
  };
  const thread: RequestHandler = async (req, res) => {
    res.json({
      items: await repo.thread(
        res.locals.identity.user.id,
        z.uuid().parse(req.params.peer),
      ),
    });
  };
  const send: RequestHandler = async (req, res) => {
    const { body } = z
      .object({ body: z.string().trim().min(1).max(4000) })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await repo.send(
          res.locals.identity.user.id,
          z.uuid().parse(req.params.peer),
          body,
        ),
      );
  };
  const review: RequestHandler = async (req, res) => {
    const p = z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(1).max(1000),
      })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await repo.review(
          res.locals.identity.user.id,
          z.uuid().parse(req.params.id),
          p.rating,
          p.comment,
        ),
      );
  };
  const personal: RequestHandler = async (_req, res) => {
    res
      .attachment("platemate.json")
      .json(await repo.personal(res.locals.identity.user.id));
  };
  const erase: RequestHandler = async (req, res) => {
    z.object({ confirm: z.literal(true) })
      .strict()
      .parse(req.body);
    await repo.erase(res.locals.identity.user.id);
    res.clearCookie("refresh", { path: "/auth/refresh" }).sendStatus(204);
  };
  return { conversations, thread, send, review, personal, erase };
}

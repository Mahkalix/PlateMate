import type { RequestHandler } from "express";
import { profileInput } from "../services/profile.js";
import { ProfileRepository } from "../repositories/profile.js";
import { z } from "zod";
export function profileController(repo: ProfileRepository) {
  const read: RequestHandler = async (_req, res) => {
    res.json(await repo.owner(res.locals.identity.user.id));
  };
  const save: RequestHandler = async (req, res) => {
    const profile = profileInput.parse(req.body);
    await repo.save(res.locals.identity.user.id, profile);
    res.json({ profile });
  };
  const patch: RequestHandler = async (req, res) => {
    const input = z
      .object(profileInput.shape)
      .partial()
      .extend({
        description: z.string().trim().max(400).optional(),
        affinities: profileInput.shape.affinities
          .refine((v) => v.length >= 3)
          .optional(),
      })
      .strict()
      .refine((p) => Object.keys(p).length > 0)
      .parse(req.body);
    res.json({
      profile: await repo.save(res.locals.identity.user.id, input, true),
    });
  };
  return { read, save, patch };
}

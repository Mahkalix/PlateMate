import type { RequestHandler } from "express";
import { profileInput } from "../services/profile.js";
import { ProfileRepository } from "../repositories/profile.js";
export function profileController(repo: ProfileRepository) {
  const read: RequestHandler = async (_req, res) => {
    res.json({ profile: await repo.get(res.locals.identity.user.id) });
  };
  const save: RequestHandler = async (req, res) => {
    const profile = profileInput.parse(req.body);
    await repo.save(res.locals.identity.user.id, profile);
    res.json({ profile });
  };
  return { read, save };
}

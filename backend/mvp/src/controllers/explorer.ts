import { z } from "zod";
import type { RequestHandler } from "express";
import { ExplorerRepository } from "../repositories/explorer.js";
const tag = z.string().trim().toLowerCase().min(1).max(80).optional();
const query = z
  .object({
    language: tag,
    ambience: tag,
    diet: tag,
    kind: tag,
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export function explorerController(repo: ExplorerRepository) {
  const list: RequestHandler = async (req, res) => {
    const filters = query.parse(req.query);
    const ranked = await repo.candidates(res.locals.identity.user.id, filters);
    const end = filters.offset + filters.limit;
    res.json({
      items: ranked.slice(filters.offset, end),
      total: ranked.length,
      nextOffset: end < ranked.length ? end : null,
    });
  };
  const detail: RequestHandler = async (req, res) => {
    const ids = z
      .object({ host: z.uuid(), context: z.uuid() })
      .parse(req.params);
    const [card] = await repo.candidates(res.locals.identity.user.id, {}, ids);
    if (!card) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ...card, slots: await repo.slots(ids.context) });
  };
  return { list, detail };
}

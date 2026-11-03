import { z } from "zod";
import type { RequestHandler } from "express";
import type pg from "pg";
const tag = z.string().trim().min(1).max(80).toLowerCase();
const tags = z.array(tag).max(24);
const slot = z
  .object({
    startsAt: z.iso
      .datetime({ offset: true })
      .refine((t) => Date.parse(t) > Date.now()),
    capacity: z.number().int().min(1).max(100),
  })
  .strict();
const context = z
  .object({
    contributionCents: z.number().int().min(0).max(100000).default(0),
    title: z.string().trim().min(1).max(120),
    kind: tag,
    ambience: tag,
    safeFor: tags,
    supportedDiets: tags,
    languages: tags.default([]),
    themes: tags.default([]),
    slots: z
      .array(slot)
      .min(1)
      .max(100)
      .refine(
        (s) => new Set(s.map((x) => Date.parse(x.startsAt))).size === s.length,
      ),
  })
  .strict();
export function hostController(db: pg.Pool) {
  const register: RequestHandler = async (req, res) => {
    z.object({})
      .strict()
      .parse(req.body ?? {});
    const result = await db.query(
      "INSERT INTO host_profiles(user_id) SELECT user_id FROM profiles WHERE user_id=$1 ON CONFLICT DO NOTHING RETURNING user_id",
      [res.locals.identity.user.id],
    );
    if (!result.rowCount) {
      res.status(409).json({ error: "profile_required_or_already_host" });
      return;
    }
    res.status(201).json({ hostId: result.rows[0].user_id });
  };
  const publish: RequestHandler = async (req, res) => {
    const p = context.parse(req.body);
    const result = await db.query(
      `WITH ctx AS (INSERT INTO contexts(host_id,title,kind,ambience,safe_for,supported_diets,languages,themes,contribution_cents)
       SELECT user_id,$2,$3,$4,$5,$6,$8,$9,$10 FROM host_profiles WHERE user_id=$1 RETURNING id),
       slots AS (INSERT INTO context_slots(context_id,starts_at,capacity) SELECT ctx.id,s."startsAt",s.capacity FROM ctx CROSS JOIN jsonb_to_recordset($7::jsonb) AS s("startsAt" timestamptz,capacity integer)) SELECT id FROM ctx`,
      [
        res.locals.identity.user.id,
        p.title,
        p.kind,
        p.ambience,
        p.safeFor,
        p.supportedDiets,
        JSON.stringify(p.slots),
        p.languages,
        p.themes,
        p.contributionCents,
      ],
    );
    if (!result.rowCount) {
      res.status(403).json({ error: "host_required" });
      return;
    }
    res.status(201).json(result.rows[0]);
  };
  return { register, publish };
}

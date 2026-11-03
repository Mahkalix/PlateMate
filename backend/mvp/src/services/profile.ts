import { z } from "zod";
const label = z.string().trim().min(1).max(80);
const tags = z
  .array(label.toLowerCase())
  .max(24)
  .refine((values) => new Set(values).size === values.length);
export const profileInput = z
  .object({
    firstName: label,
    lastName: label,
    city: label,
    neighborhood: label.optional(),
    description: z.string().trim().max(1000).optional(),
    languages: tags.refine((v) => v.length > 0),
    affinities: tags.refine((v) => v.length > 0),
    publicInterests: tags,
    ambiences: tags.refine((v) => v.length > 0),
    diets: tags,
    allergies: tags,
    intolerances: tags,
    cuisines: tags,
    consent: z.boolean(),
  })
  .strict()
  .refine(
    (p) =>
      p.consent ||
      !(p.diets.length + p.allergies.length + p.intolerances.length),
  )
  .refine((p) => p.publicInterests.every((i) => p.affinities.includes(i)));
export type Profile = z.infer<typeof profileInput>;
export function completeness(p: Profile) {
  const required = [
    p.firstName,
    p.lastName,
    p.city,
    p.languages.length,
    p.ambiences.length,
    p.affinities.length,
  ];
  return Math.floor((100 * required.filter(Boolean).length) / required.length);
}

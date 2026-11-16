import { z } from "zod";
const tags = z
  .array(z.string().trim().min(1).max(80).toLowerCase())
  .max(24)
  .refine((v) => new Set(v).size === v.length);
export const tableInput = z
  .object({
    specialties: tags,
    supportedDiets: tags,
    languages: tags.min(1),
    additionalInformation: z.string().trim().max(1000),
    address: z
      .object({
        street: z.string().trim().min(1).max(200),
        postalCode: z.string().trim().min(1).max(20),
        city: z.string().trim().min(1).max(80),
        instructions: z.string().trim().max(500),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type Table = z.infer<typeof tableInput>;
export function mealSection(status: string, startsAt: Date, now = new Date()) {
  if (status === "cancelled" || status === "declined") return "cancelled";
  return status === "completed" || startsAt <= now ? "past" : "upcoming";
}

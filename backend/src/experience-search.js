import { z } from 'zod';

// Labels are case-insensitive. Dietary options use stable identifiers, e.g. vegan.
export const dietaryTag = z.string().trim().min(1).max(60).transform(value => value.toLowerCase());
const textFilter = z.string().trim().min(1).max(100).optional();
const integerFilter = (min, max, fallback) => z.string().regex(/^\d+$/)
  .transform(Number).pipe(z.number().int().min(min).max(max)).default(fallback);
export const experienceFilters = z.object({
  city: textFilter,
  cuisine: textFilter,
  theme: textFilter,
  atmosphere: textFilter,
  language: textFilter,
  diet: z.union([z.string(), z.array(z.string())]).transform(value => (
    Array.isArray(value) ? value : value.split(',')
  )).pipe(z.array(dietaryTag).min(1).max(20)).optional(),
  date: z.iso.date().optional(),
  guests: integerFilter(1, 10, 1),
  limit: integerFilter(1, 50, 20),
  offset: integerFilter(0, 10000, 0),
  sort: z.enum(['date', 'price_asc', 'price_desc']).default('date')
}).strict();

export function buildExperienceSearch(filters) {
  const order = {
    date: 'available."nextDate" ASC, e.id ASC',
    price_asc: '(e.menu_price_cents + e.service_fee_cents) ASC, e.id ASC',
    price_desc: '(e.menu_price_cents + e.service_fee_cents) DESC, e.id ASC'
  }[filters.sort];
  return {
    text: `SELECT e.id, e.title, e.city, e.cuisine, e.theme, e.atmosphere,
      e.photo_url AS "photoUrl", e.dietary_options AS "dietaryOptions",
      e.menu_price_cents AS "menuPriceCents", e.service_fee_cents AS "serviceFeeCents",
      e.menu_price_cents + e.service_fee_cents AS "totalPerGuestCents",
      e.host_id AS "hostId", p.display_name AS "hostName", p.photo_url AS "hostPhotoUrl",
      p.bio AS "hostBio", p.languages AS "hostLanguages", p.interests AS "hostInterests",
      available."nextDate"
      FROM experiences e JOIN profiles p ON p.user_id = e.host_id
      JOIN LATERAL (
        SELECT MIN(d.starts_at) AS "nextDate" FROM experience_dates d
        WHERE d.experience_id = e.id AND d.starts_at > now()
          AND ($7::date IS NULL OR (d.starts_at AT TIME ZONE 'Europe/Paris')::date = $7::date)
          AND d.capacity - COALESCE((SELECT SUM(b.guests) FROM bookings b
            WHERE b.date_id = d.id AND b.status IN ('accepted','checkout_pending','paid')), 0) >= $8
      ) available ON available."nextDate" IS NOT NULL
      WHERE e.published
        AND ($1::text IS NULL OR lower(e.city) = lower($1))
        AND ($2::text IS NULL OR lower(e.cuisine) = lower($2))
        AND ($3::text IS NULL OR lower(e.theme) = lower($3))
        AND ($4::text IS NULL OR lower(e.atmosphere) = lower($4))
        AND ($5::text IS NULL OR EXISTS (SELECT 1 FROM unnest(p.languages) language WHERE lower(language) = lower($5)))
        AND (cardinality($6::text[]) = 0 OR $6::text[] <@ ARRAY(SELECT lower(option) FROM unnest(e.dietary_options) option))
      ORDER BY ${order} LIMIT $9 OFFSET $10`,
    values: [filters.city ?? null, filters.cuisine ?? null, filters.theme ?? null,
      filters.atmosphere ?? null, filters.language ?? null, filters.diet ?? [],
      filters.date ?? null, filters.guests, filters.limit + 1, filters.offset]
  };
}

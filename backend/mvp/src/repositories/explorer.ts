import type pg from "pg";
import { completeness, type Profile } from "../services/profile.js";
import { score, compatible } from "../services/scoring.js";
import { ProfileRepository } from "./profile.js";
export type Filters = {
  language?: string;
  ambience?: string;
  diet?: string;
  kind?: string;
  city?: string;
  date?: string;
  cuisine?: string;
};
export class ExplorerRepository {
  constructor(private db: pg.Pool) {}
  async candidates(
    userId: string | null,
    filters: Filters,
    detail?: { host: string; context: string },
  ) {
    const viewer: Profile | null = userId
      ? await new ProfileRepository(this.db).get(userId)
      : null;
    if (userId && !viewer) return [];
    const { rows } = await this.db.query(
      `SELECT c.*,p.details,p.is_verified, (SELECT count(*)::int FROM reviews WHERE subject_id=c.host_id) AS review_count,(SELECT avg(rating)::float FROM reviews WHERE subject_id=c.host_id) AS average_rating,(SELECT coalesce(sum(b.party_size),0)::int FROM bookings b JOIN context_slots s ON s.id=b.slot_id JOIN contexts ctx ON ctx.id=s.context_id WHERE ctx.host_id=c.host_id AND b.status='completed') AS guests_welcomed FROM contexts c JOIN profiles p ON p.user_id=c.host_id WHERE ($1::uuid IS NULL OR c.host_id<>$1) AND ($2::text IS NULL OR $2=ANY(c.languages)) AND ($3::text IS NULL OR c.ambience=$3) AND ($4::text IS NULL OR $4=ANY(c.supported_diets)) AND ($5::text IS NULL OR c.kind=$5) AND ($6::uuid IS NULL OR c.host_id=$6) AND ($7::uuid IS NULL OR c.id=$7) AND ($8::text IS NULL OR lower(p.details->>'city')=lower($8)) AND ($9::text IS NULL OR strpos(lower(c.kind || ' ' || c.title),lower($9))>0) AND ($10::date IS NULL OR EXISTS (SELECT 1 FROM context_slots s WHERE s.context_id=c.id AND (s.starts_at AT TIME ZONE 'Europe/Paris')::date=$10::date AND s.starts_at>now() AND s.capacity > coalesce((SELECT sum(b.party_size) FROM bookings b WHERE b.slot_id=s.id AND b.status IN ('accepted','completed')),0))) ORDER BY c.id`,
      [
        userId,
        filters.language,
        filters.ambience,
        filters.diet,
        filters.kind,
        detail?.host,
        detail?.context,
        filters.city,
        filters.cuisine,
        filters.date,
      ],
    );
    return rows
      .filter((r) =>
        !viewer || compatible(viewer.allergies, viewer.intolerances, r.safe_for),
      )
      .map((r) => {
        const p: Profile = r.details;
        const card = {
          hostId: r.host_id,
          contextId: r.id,
          contextTitle: r.title,
          kind: r.kind,
          ambience: r.ambience,
          firstName: p.firstName,
          city: p.city,
          isVerified: r.is_verified,
          reviewCount: r.review_count,
          averageRating: r.average_rating,
          completeness: completeness(p),
          score: viewer ? score(viewer, {
            languages: r.languages,
            affinities: r.themes,
            diets: r.supported_diets,
          }) : 0,
        };
        return detail
          ? {
              ...card,
              contributionCents: r.contribution_cents,
              guestsWelcomed: r.guests_welcomed,
              description: p.description,
              neighborhood: p.neighborhood,
              languages: r.languages,
              themes: r.themes,
              commonInterests: p.publicInterests.filter((i) =>
                viewer?.publicInterests.includes(i),
              ),
            }
          : card;
      })
      .sort((a, b) => b.score - a.score);
  }
  async slots(context: string) {
    return (
      await this.db.query(
        `SELECT id,starts_at AS "startsAt",capacity,capacity-coalesce((SELECT sum(party_size)::int FROM bookings WHERE slot_id=context_slots.id AND status IN ('accepted','completed')),0) AS "remainingPlaces" FROM context_slots WHERE context_id=$1 AND starts_at>now() ORDER BY starts_at`,
        [context],
      )
    ).rows;
  }
}

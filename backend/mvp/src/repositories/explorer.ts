import type pg from "pg";
import type { Profile } from "../services/profile.js";
import { score, compatible } from "../services/scoring.js";
import { ProfileRepository } from "./profile.js";
export type Filters = {
  language?: string;
  ambience?: string;
  diet?: string;
  kind?: string;
};
export class ExplorerRepository {
  constructor(private db: pg.Pool) {}
  async candidates(
    userId: string,
    filters: Filters,
    detail?: { host: string; context: string },
  ) {
    const viewer: Profile | null = await new ProfileRepository(this.db).get(
      userId,
    );
    if (!viewer) return [];
    const { rows } = await this.db.query(
      `SELECT c.*,p.details,p.is_verified FROM contexts c JOIN profiles p ON p.user_id=c.host_id WHERE c.host_id<>$1 AND ($2::text IS NULL OR (p.details->'languages') ? $2) AND ($3::text IS NULL OR c.ambience=$3) AND ($4::text IS NULL OR $4=ANY(c.supported_diets)) AND ($5::text IS NULL OR c.kind=$5) AND ($6::uuid IS NULL OR c.host_id=$6) AND ($7::uuid IS NULL OR c.id=$7) ORDER BY c.host_id,c.id`,
      [
        userId,
        filters.language,
        filters.ambience,
        filters.diet,
        filters.kind,
        detail?.host,
        detail?.context,
      ],
    );
    return rows
      .filter((r) =>
        compatible(viewer.allergies, viewer.intolerances, r.safe_for),
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
          score: score(viewer, { ...p, diets: r.supported_diets }),
        };
        return detail
          ? {
              ...card,
              description: p.description,
              neighborhood: p.neighborhood,
              languages: p.languages,
              commonInterests: p.publicInterests.filter((i) =>
                viewer.publicInterests.includes(i),
              ),
            }
          : card;
      })
      .sort((a, b) => b.score - a.score);
  }
  async slots(context: string) {
    return (
      await this.db.query(
        'SELECT id,starts_at AS "startsAt",capacity FROM context_slots WHERE context_id=$1 AND starts_at>now() ORDER BY starts_at',
        [context],
      )
    ).rows;
  }
}

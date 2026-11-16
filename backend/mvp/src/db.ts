import { pool } from "./pool.js";
import { migrate } from "./migrations.js";
try {
  await migrate(pool);
  if (process.argv[2] === "seed") {
    await pool.query(
      `WITH account AS (
         INSERT INTO users(email) VALUES($1)
         ON CONFLICT(email) DO NOTHING RETURNING id
       ), profile AS (
         INSERT INTO profiles(user_id,details) SELECT id,$2 FROM account RETURNING user_id
       ), host AS (
         INSERT INTO host_profiles SELECT user_id FROM profile RETURNING user_id
       ), context AS (
         INSERT INTO contexts(host_id,title,kind,ambience,supported_diets,safe_for,languages,themes)
         SELECT user_id,'Promenade à Grenoble','balade','calme',ARRAY['vegan'],ARRAY['arachide'],ARRAY['fr'],ARRAY['jazz'] FROM host RETURNING id
       ) INSERT INTO context_slots(context_id,starts_at,capacity)
         SELECT id,now()+interval '30 days',4 FROM context`,
      [
        "demo@example.invalid",
        {
          firstName: "Amina",
          lastName: "Démo",
          city: "Grenoble",
          languages: ["fr"],
          affinities: ["jazz"],
          publicInterests: ["jazz"],
          ambiences: ["calme"],
          diets: [],
          allergies: [],
          intolerances: [],
          cuisines: [],
          consent: false,
        },
      ],
    );
  }
} finally {
  await pool.end();
}

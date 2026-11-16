import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
import { pool } from "../../src/pool.js";
it("US06 US07 US08 US09 / Explorer : tri, filtres, pagination, confidentialité et exclusion dure", async () => {
  const api = client(),
    auth = "Bearer " + (await signedIn(api)).access;
  await api
    .put("/me/profile")
    .set("Authorization", auth)
    .send({ ...profile, publicInterests: ["jazz"] })
    .expect(200);
  for (const [i, lang, safe] of [
    [1, "fr", true],
    [2, "en", true],
    [3, "fr", false],
  ] as const) {
    const user = (
      await pool.query("insert into users(email) values($1) returning id", [
        i + "@x.org",
      ])
    ).rows[0];
    await pool.query("insert into profiles(user_id,details) values($1,$2)", [
      user.id,
      {
        ...profile,
        firstName: "Host" + i,
        publicInterests: ["jazz"],
        languages: [lang],
      },
    ]);
    await pool.query("insert into host_profiles(user_id) values($1)", [
      user.id,
    ]);
    await pool.query(
      "insert into contexts(host_id,title,kind,ambience,supported_diets,safe_for,languages,themes) values($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        user.id,
        "Rencontre",
        "balade",
        "calme",
        ["vegan"],
        safe ? ["arachide"] : [],
        [lang],
        ["jazz"],
      ],
    );
  }
  const publicPage = (await api.get("/public/explorer").expect(200)).body;
  expect(publicPage.total).toBe(3);
  expect(publicPage.items.every((item: { score: number }) => item.score === 0)).toBe(true);
  for (const item of publicPage.items) {
    expect(Object.keys(item).sort()).toEqual(["hostId", "contextId", "contextTitle", "kind", "ambience", "firstName", "city", "isVerified", "reviewCount", "averageRating", "completeness", "score"].sort());
  }
  expect(JSON.stringify(publicPage)).not.toContain("arachide");
  expect((await api.get("/public/explorer?limit=1&offset=1").expect(200)).body.items).toHaveLength(1);
  expect((await api.get("/public/explorer?language=inconnue").expect(200)).body.items).toEqual([]);
  await api.get("/public/explorer?limit=0").expect(422);
  await api.get("/public/explorer?limit=1&preview=1").expect(200);
  const get = (q: object) =>
    api.get("/explorer").set("Authorization", auth).query(q);
  const secondMeal = await pool.query(
    "insert into contexts(host_id,title,kind,ambience,safe_for,languages,themes) select host_id,'Deuxième repas','dîner','animée',safe_for,ARRAY['it'],ARRAY['cinéma'] from contexts where languages=ARRAY['fr'] and cardinality(safe_for)>0 returning id",
  );
  expect(
    (await get({ language: "it" })).body.items.map(
      (c: { contextId: string }) => c.contextId,
    ),
  ).toEqual([secondMeal.rows[0].id]);
  const page = (await get({ limit: 1 }).expect(200)).body;
  expect(page.total).toBe(3);
  expect(page.items[0].score).toBe(100);
  await pool.query(
    "update profiles set details=details || $1::jsonb where user_id=$2",
    [
      JSON.stringify({ languages: ["de"], affinities: ["danse"] }),
      page.items[0].hostId,
    ],
  );
  expect((await get({ language: "fr" })).body.items[0].score).toBe(100);
  expect(page.items[0].firstName).toBe("Host1");
  const next = (await get({ limit: 1, offset: 1 }).expect(200)).body;
  expect(next.items[0].firstName).toBe("Host2");
  for (const q of [
    { language: "de" },
    { ambience: "inconnue" },
    { diet: "halal" },
    { kind: "atelier" },
    { kind: "' OR 1=1 --" },
  ])
    expect((await get(q).expect(200)).body.items).toEqual([]);
  expect((await get({ city: profile.city.toUpperCase(), cuisine: "RENCONTRE" }).expect(200)).body.total).toBe(2);
  expect((await get({ city: "Ville inexistante" }).expect(200)).body.items).toEqual([]);
  expect((await get({ cuisine: "' OR 1=1 --" }).expect(200)).body.items).toEqual([]);
  await get({ date: "invalid" }).expect(422);
  await pool.query("insert into context_slots(context_id,starts_at,capacity) values($1,'2099-06-15T18:00:00Z',4)", [page.items[0].contextId]);
  expect((await get({ date: "2099-06-15" }).expect(200)).body.items.map((item: { contextId: string }) => item.contextId)).toEqual([page.items[0].contextId]);
  expect((await get({ date: "2099-06-16" }).expect(200)).body.items).toEqual([]);
  const card = page.items[0];
  expect(Object.keys(card).sort()).toEqual(
    [
      "ambience",
      "city",
      "contextId",
      "contextTitle",
      "firstName",
      "hostId",
      "isVerified",
      "reviewCount",
      "averageRating",
      "completeness",
      "kind",
      "score",
    ].sort(),
  );
  const detail = (
    await api
      .get("/profiles/" + card.hostId + "/contexts/" + card.contextId)
      .set("Authorization", auth)
      .expect(200)
  ).body;
  expect(detail.commonInterests).toEqual(["jazz"]);
  expect(detail).toMatchObject({
    guestsWelcomed: 0,
    reviewCount: 0,
    averageRating: null,
  });
  expect(JSON.stringify(detail)).not.toContain("arachide");
  await get({ limit: 0 }).expect(422);
});

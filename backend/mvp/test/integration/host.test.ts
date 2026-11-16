import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
import { pool } from "../../src/pool.js";
export const contextInput = {
  title: "Balade",
  kind: "balade",
  ambience: "calme",
  supportedDiets: ["vegan"],
  safeFor: ["arachide"],
  slots: [{ startsAt: "2099-01-02T12:00:00Z", capacity: 3 }],
};
it("US12 / Candidature hôte : profil préalable, hôte additionnel unique, plusieurs créneaux atomiques", async () => {
  const api = client(),
    auth = "Bearer " + (await signedIn(api)).access;
  await api.post("/me/host").set("Authorization", auth).send({}).expect(409);
  await api.put("/me/profile").set("Authorization", auth).send(profile);
  await api
    .post("/me/contexts")
    .set("Authorization", auth)
    .send(contextInput)
    .expect(403);
  await api.post("/me/host").set("Authorization", auth).send({}).expect(201);
  await api.post("/me/host").set("Authorization", auth).send({}).expect(409);
  await api
    .post("/me/contexts")
    .set("Authorization", auth)
    .send({ ...contextInput, slots: [] })
    .expect(422);
  const r = await api
    .post("/me/contexts")
    .set("Authorization", auth)
    .send({
      ...contextInput,
      slots: [
        ...contextInput.slots,
        { startsAt: "2099-01-03T12:00:00Z", capacity: 2 },
      ],
    })
    .expect(201);
  expect(
    (
      await pool.query(
        "select capacity from context_slots where context_id=$1 order by starts_at",
        [r.body.id],
      )
    ).rows,
  ).toEqual([{ capacity: 3 }, { capacity: 2 }]);
});
it("US13 / Profil : le propriétaire ne peut pas attribuer le badge, vérification opérateur visible", async () => {
  const api = client(),
    auth = "Bearer " + (await signedIn(api)).access;
  await api
    .put("/me/profile")
    .set("Authorization", auth)
    .send({ ...profile, isVerified: true })
    .expect(422);
  await api.put("/me/profile").set("Authorization", auth).send(profile);
  const before = (await api.get("/me/profile").set("Authorization", auth)).body;
  expect(before.badges.isVerified).toBe(false);
  await pool.query("update profiles set is_verified=true");
  expect(
    (await api.get("/me/profile").set("Authorization", auth)).body.badges,
  ).toMatchObject({ isVerified: true, completeness: expect.any(Number) });
});

import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
it("US04 / Profil : état initial puis préremplissage et modification", async () => {
  const api = client();
  const auth = "Bearer " + (await signedIn(api)).access;
  await api
    .get("/me/profile")
    .set("Authorization", auth)
    .expect(200, { profile: null });
  await api
    .put("/me/profile")
    .set("Authorization", auth)
    .send(profile)
    .expect(200);
  await api
    .put("/me/profile")
    .set("Authorization", auth)
    .send({ ...profile, city: "Paris" })
    .expect(200);
  const r = await api.get("/me/profile").set("Authorization", auth).expect(200);
  expect(r.body.profile).toMatchObject({ ...profile, city: "Paris" });
});
it("US15 / Profil : injection d’un identifiant tiers ou collecte sans consentement refusée", async () => {
  const api = client();
  const auth = "Bearer " + (await signedIn(api)).access;
  for (const patch of [{ userId: "autrui" }, { consent: false }])
    await api
      .put("/me/profile")
      .set("Authorization", auth)
      .send({ ...profile, ...patch })
      .expect(422);
  await api
    .get("/me/profile")
    .set("Authorization", auth)
    .expect(200, { profile: null });
});

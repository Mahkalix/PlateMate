import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
import { pool } from "../../src/pool.js";

const table = {
  specialties: ["libanaise"],
  supportedDiets: ["vegan"],
  languages: ["fr"],
  additionalInformation: "Chat � la maison",
  address: {
    street: "12 rue priv�e",
    postalCode: "38000",
    city: "Grenoble",
    instructions: "Interphone priv�",
  },
};
async function fixture() {
  const api = client();
  async function account(email: string) {
    const session = await signedIn(api, email),
      auth = "Bearer " + session.access;
    await api
      .put("/me/profile")
      .set("Authorization", auth)
      .send(profile)
      .expect(200);
    return { ...session, auth };
  }
  const host = await account("host@example.org"),
    guest = await account("guest@example.org"),
    other = await account("other@example.org");
  await api
    .post("/me/host")
    .set("Authorization", host.auth)
    .send({})
    .expect(201);
  await api
    .put("/me/table")
    .set("Authorization", host.auth)
    .send(table)
    .expect(200);
  const context = (
    await api
      .post("/me/contexts")
      .set("Authorization", host.auth)
      .send({
        title: "Mezz�s",
        kind: "d�ner",
        ambience: "calme",
        safeFor: ["arachide"],
        supportedDiets: [],
        slots: [{ startsAt: "2099-01-01T12:00:00Z", capacity: 4 }],
      })
      .expect(201)
  ).body.id;
  const slot = (
    await pool.query("SELECT id FROM context_slots WHERE context_id=$1", [
      context,
    ])
  ).rows[0].id;
  const booking = (
    await api
      .post("/bookings")
      .set("Authorization", guest.auth)
      .send({ slotId: slot, partySize: 2 })
      .expect(201)
  ).body.id;
  return { api, host, guest, other, booking, slot };
}
it("account edits preserve preferences and reject identity, badge and invalid fields", async () => {
  const { api, guest, host } = await fixture();
  await api
    .patch("/me/profile")
    .set("Authorization", guest.auth)
    .send({
      description: "Bonjour",
      phone: "0612345678",
      birthDate: "2002-04-12",
    })
    .expect(200);
  const owner = (
    await api.get("/me/profile").set("Authorization", guest.auth).expect(200)
  ).body;
  expect(owner.profile).toMatchObject({
    ...profile,
    description: "Bonjour",
    phone: "0612345678",
  });
  for (const patch of [
    { email: "fake@example.org" },
    { isVerified: true },
    { affinities: ["jazz"] },
    { description: "a".repeat(401) },
    { birthDate: "2099-01-01" },
    {},
  ])
    await api
      .patch("/me/profile")
      .set("Authorization", guest.auth)
      .send(patch)
      .expect(422);
  await api
    .put("/me/table")
    .set("Authorization", guest.auth)
    .send(table)
    .expect(403);
  expect(
    (await api.get("/me/table").set("Authorization", host.auth)).body.table,
  ).toEqual(table);
  expect(
    (await api.get("/me/account-summary").set("Authorization", guest.auth))
      .body,
  ).toMatchObject({ isHost: false, hostsMet: 0, cuisinesDiscovered: null });
});
it("meals include unbooked slots, isolate accounts and reveal address only while accepted", async () => {
  const { api, host, guest, other, booking, slot } = await fixture();
  const meals = (auth: string, view = "guest") =>
    api
      .get("/me/meals?view=" + view)
      .set("Authorization", auth)
      .expect(200);
  expect((await meals(other.auth)).body.sections).toEqual({
    upcoming: [],
    past: [],
    cancelled: [],
  });
  expect(
    (await meals(guest.auth)).body.sections.upcoming[0].address,
  ).toBeNull();
  await api
    .patch(`/bookings/${booking}/status`)
    .set("Authorization", host.auth)
    .send({ status: "accepted" })
    .expect(200);
  expect((await meals(guest.auth)).body.sections.upcoming[0].address).toEqual(
    table.address,
  );
  expect(
    (await meals(host.auth, "host")).body.sections.upcoming[0],
  ).toMatchObject({ confirmedPlaces: 2, remainingPlaces: 2 });
  await api
    .patch(`/bookings/${booking}/status`)
    .set("Authorization", guest.auth)
    .send({ status: "cancelled" })
    .expect(200);
  expect((await meals(guest.auth)).body.sections.cancelled[0]).toMatchObject({
    address: null,
    cancelledBy: "guest",
    refundedCents: 0,
  });
  expect((await meals(host.auth, "host")).body.sections.upcoming).toHaveLength(
    1,
  );
  await pool.query(
    "UPDATE context_slots SET starts_at=now()-interval '1 day' WHERE id=$1",
    [slot],
  );
  expect((await meals(host.auth, "host")).body.sections.past).toHaveLength(1);
  await api
    .get("/me/meals?limit=101")
    .set("Authorization", guest.auth)
    .expect(422);
});
it("allergy disclosure requires guest consent, accepted booking and the specific host", async () => {
  const { api, host, guest, other, booking } = await fixture();
  const read = (auth: string) =>
    api.get(`/bookings/${booking}/shared-allergies`).set("Authorization", auth);
  const consent = (auth: string, value: boolean) =>
    api
      .put(`/bookings/${booking}/allergy-consent`)
      .set("Authorization", auth)
      .send({ consent: value });
  await read(host.auth).expect(200, { allergies: null });
  await consent(host.auth, true).expect(404);
  await consent(other.auth, true).expect(404);
  await consent(guest.auth, true).expect(200);
  await read(host.auth).expect(200, { allergies: null });
  await api
    .patch(`/bookings/${booking}/status`)
    .set("Authorization", host.auth)
    .send({ status: "accepted" })
    .expect(200);
  await read(host.auth).expect(200, { allergies: ["arachide"] });
  await read(other.auth).expect(404);
  await read(guest.auth).expect(404);
  await consent(guest.auth, false).expect(200, { consent: null });
  await read(host.auth).expect(200, { allergies: null });
  await consent(guest.auth, true).expect(200);
  await api
    .patch("/me/profile")
    .set("Authorization", guest.auth)
    .send({ allergies: ["s�same"] })
    .expect(200);
  await read(host.auth).expect(200, { allergies: null });
  await api
    .patch("/me/profile")
    .set("Authorization", guest.auth)
    .send({ allergies: ["arachide"] })
    .expect(200);
  await read(host.auth).expect(200, { allergies: null });
  await consent(guest.auth, true).expect(200);
  await api
    .patch(`/bookings/${booking}/status`)
    .set("Authorization", guest.auth)
    .send({ status: "cancelled" })
    .expect(200);
  await read(host.auth).expect(200, { allergies: null });
  await consent(guest.auth, true).expect(409);
  for (const path of [
    "/me/table",
    "/me/meals",
    "/me/account-summary",
    `/bookings/${booking}/shared-allergies`,
  ])
    await api.get(path).expect(401);
});

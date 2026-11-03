import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
import { pool } from "../../src/pool.js";
it("US16 US17 / Réservations : participants, capacité, transitions, intention simulée et historique", async () => {
  const api = client();
  async function account(email: string) {
    const { id, access } = await signedIn(api, email);
    const auth = "Bearer " + access;
    await api
      .put("/me/profile")
      .set("Authorization", auth)
      .send(profile)
      .expect(200);
    return { id, auth };
  }
  const host = await account("host@example.org"),
    guest = await account("guest@example.org"),
    other = await account("other@example.org");
  await api
    .post("/me/host")
    .set("Authorization", host.auth)
    .send({})
    .expect(201);
  const ctx = (
    await api
      .post("/me/contexts")
      .set("Authorization", host.auth)
      .send({
        title: "Balade",
        kind: "balade",
        ambience: "calme",
        safeFor: ["arachide"],
        supportedDiets: [],
        slots: [{ capacity: 1, startsAt: "2099-01-01T12:00:00Z" }],
      })
      .expect(201)
  ).body.id;
  const slot = (
    await pool.query("select id from context_slots where context_id=$1", [ctx])
  ).rows[0].id;
  const book = (auth: string) =>
    api
      .post("/bookings")
      .set("Authorization", auth)
      .send({ slotId: slot, partySize: 1 });
  const first = (await book(guest.auth).expect(201)).body;
  expect(first.status).toBe("pending");
  await book(guest.auth).expect(409);
  const update = (id: string, auth: string, status: string) =>
    api
      .patch("/bookings/" + id + "/status")
      .set("Authorization", auth)
      .send({ status });
  await update(first.id, other.auth, "accepted").expect(404);
  await update(first.id, guest.auth, "accepted").expect(403);
  const second = (await book(other.auth).expect(201)).body;
  await api
    .put("/me/profile")
    .set("Authorization", guest.auth)
    .send({ ...profile, intolerances: ["lactose"] })
    .expect(200);
  await update(first.id, host.auth, "accepted").expect(409, {
    error: "booking_no_longer_eligible",
  });
  await api
    .put("/me/profile")
    .set("Authorization", guest.auth)
    .send(profile)
    .expect(200);
  const results = await Promise.all([
    update(first.id, host.auth, "accepted"),
    update(second.id, host.auth, "accepted"),
  ]);
  expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  const winner = results[0].status === 200 ? first : second;
  const participant = winner === first ? guest : other;
  await api
    .post("/bookings/" + winner.id + "/payment-intent")
    .set("Authorization", host.auth)
    .expect(404);
  await api
    .post("/bookings/" + winner.id + "/payment-intent")
    .set("Authorization", participant.auth)
    .expect(200, { paymentIntentStatus: "simulated" });
  await update(winner.id, host.auth, "completed").expect(409);
  await pool.query(
    "update context_slots set starts_at=now()-interval '1 day' where id=$1",
    [slot],
  );
  await update(winner.id, host.auth, "completed").expect(200);
  await update(winner.id, host.auth, "pending").expect(409);
  const list = (
    await api
      .get("/me/bookings?view=guest")
      .set("Authorization", participant.auth)
      .expect(200)
  ).body.items;
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({
    contextId: ctx,
    slotId: slot,
    status: "completed",
    paymentIntentStatus: "simulated",
    history: ["pending", "accepted", "completed"],
  });
}, 15000);

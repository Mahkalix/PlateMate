import { it, expect } from "vitest";
import { client, credentials } from "../auth-fixture.js";
import { profile } from "../profile-fixture.js";
import { pool } from "../../src/pool.js";
async function account(api: ReturnType<typeof client>, email: string) {
  const body = { ...credentials, email };
  const id = (await api.post("/auth/register").send(body).expect(201)).body.id;
  const auth =
    "Bearer " +
    (await api.post("/auth/login").send(body).expect(200)).body.accessToken;
  await api
    .put("/me/profile")
    .set("Authorization", auth)
    .send(profile)
    .expect(200);
  return { auth, id };
}
it("US10 US11 US15 / Conversation et Mon compte : fil privé ordonné, export personnel et effacement en base", async () => {
  const api = client(),
    a = await account(api, "a@x.org"),
    b = await account(api, "b@x.org"),
    c = await account(api, "c@x.org");
  const url = (id: string) => "/conversations/" + id + "/messages";
  await api
    .get("/conversations")
    .set("Authorization", a.auth)
    .expect(200, { items: [] });
  await api
    .get(url(b.id))
    .set("Authorization", a.auth)
    .expect(200, { items: [] });
  for (const body of ["Bonjour", "À demain"])
    await api
      .post(url(b.id))
      .set("Authorization", a.auth)
      .send({ body })
      .expect(201);
  await api
    .post(url(a.id))
    .set("Authorization", b.auth)
    .send({ body: "Merci" })
    .expect(201);
  expect(
    (await api.get(url(b.id)).set("Authorization", a.auth)).body.items.map(
      (x: { body: string }) => x.body,
    ),
  ).toEqual(["Bonjour", "À demain", "Merci"]);
  expect(
    (await api.get("/conversations").set("Authorization", a.auth)).body
      .items[0],
  ).toMatchObject({ peerId: b.id, preview: "Merci" });
  await api
    .get(url(b.id))
    .set("Authorization", c.auth)
    .expect(200, { items: [] });
  await api
    .post(url(b.id))
    .set("Authorization", a.auth)
    .send({ body: " " })
    .expect(422);
  const data = (
    await api.get("/me/export").set("Authorization", a.auth).expect(200)
  ).body;
  expect(data.profile.allergies).toEqual(["arachide"]);
  expect(JSON.stringify(data)).not.toContain("password_hash");
  expect(JSON.stringify(data)).not.toContain("b@x.org");
  await api
    .delete("/me/account")
    .set("Authorization", a.auth)
    .send({ confirm: false })
    .expect(422);
  await api
    .delete("/me/account")
    .set("Authorization", a.auth)
    .send({ confirm: true })
    .expect(204);
  const result = await pool.query(
    "SELECT (SELECT count(*) FROM users WHERE id=$1)+(SELECT count(*) FROM profiles WHERE user_id=$1)+(SELECT count(*) FROM sessions WHERE user_id=$1)+(SELECT count(*) FROM messages WHERE $1 IN(sender_id,recipient_id)) AS remaining",
    [a.id],
  );
  expect(Number(result.rows[0].remaining)).toBe(0);
  await api.get("/me").set("Authorization", a.auth).expect(401);
}, 15000);
it("US14 / Après la rencontre : contrôle participant, completed et doublon", async () => {
  const api = client(),
    host = await account(api, "h@x.org"),
    guest = await account(api, "g@x.org"),
    other = await account(api, "o@x.org");
  await pool.query("insert into host_profiles values($1)", [host.id]);
  const ctx = (
    await pool.query(
      "insert into contexts(host_id,title,kind,ambience) values($1,'Balade','marche','calme') returning id",
      [host.id],
    )
  ).rows[0];
  const slot = (
    await pool.query(
      "insert into context_slots(context_id,starts_at,capacity) values($1,now(),2) returning id",
      [ctx.id],
    )
  ).rows[0];
  const b = (
    await pool.query(
      "insert into bookings(slot_id,guest_id,party_size) values($1,$2,1) returning id",
      [slot.id, guest.id],
    )
  ).rows[0];
  const post = (auth: string) =>
    api
      .post("/bookings/" + b.id + "/review")
      .set("Authorization", auth)
      .send({ rating: 5, comment: "Merci pour la rencontre" });
  await post(other.auth).expect(404);
  await post(guest.auth).expect(409);
  await pool.query("update bookings set status='completed' where id=$1", [
    b.id,
  ]);
  await post(guest.auth).expect(201);
  await post(guest.auth).expect(409);
  expect(
    (await pool.query("select subject_id,rating from reviews")).rows,
  ).toEqual([{ subject_id: host.id, rating: 5 }]);
}, 15000);

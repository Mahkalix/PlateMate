import { it, expect } from "vitest";
import { client, signedIn } from "../auth-fixture.js";
it("US18 / Portefeuille : aucun mouvement avant un rechargement confirmé", async () => {
  const api = client(),
    { access } = await signedIn(api);
  await api
    .get("/me/wallet")
    .set("Authorization", "Bearer " + access)
    .expect(200, { currency: "eur", balanceCents: 0, entries: [] });
  const result = await api
    .post("/me/wallet/topups")
    .set("Authorization", "Bearer " + access)
    .send({ amountCents: -1 })
    .expect(422);
  expect(result.body.error).toBe("invalid_input");
});
it("US18 / Portefeuille : un webhook non signé ne crédite rien", async () => {
  const response = await client()
    .post("/stripe/webhook")
    .send({ type: "payment_intent.succeeded" })
    .expect(400);
  expect(response.body.error).toBe("invalid_signature");
});
import { vi, afterEach } from "vitest";
import Stripe from "stripe";
import { randomUUID } from "node:crypto";
import * as gateway from "../../src/stripe.js";
import { pool } from "../../src/pool.js";
import { settleNext } from "../../src/repositories/settlements.js";
import { profile } from "../profile-fixture.js";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
it("US17 US18 / Portefeuille et Réservations : recharge signée, débit unique, remboursement et virement après le repas", async () => {
  const api = client(),
    stripe = new Stripe("sk_test_fixture");
  vi.spyOn(gateway, "testStripe").mockReturnValue(stripe);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
  vi.stubEnv("STRIPE_CONNECT_WEBHOOK_SECRET", "whsec_connected");
  vi.stubEnv("APP_ORIGIN", "http://localhost:8080");
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
  const host = await account("host@pay.test"),
    guest = await account("guest@pay.test");
  await api
    .post("/me/host")
    .set("Authorization", host.auth)
    .send({})
    .expect(201);
  vi.spyOn(stripe.accounts, "create").mockResolvedValue({
    id: "acct_test",
  } as never);
  vi.spyOn(stripe.accountLinks, "create").mockResolvedValue({
    url: "https://connect.stripe.test/start",
  } as never);
  await api
    .post("/me/host/onboarding")
    .set("Authorization", guest.auth)
    .expect(403);
  await api
    .post("/me/host/onboarding")
    .set("Authorization", host.auth)
    .expect(200, { url: "https://connect.stripe.test/start" });
  const context = (
    await api
      .post("/me/contexts")
      .set("Authorization", host.auth)
      .send({
        title: "Table",
        kind: "repas",
        ambience: "calme",
        safeFor: ["arachide"],
        supportedDiets: [],
        contributionCents: 1200,
        slots: [
          { capacity: 2, startsAt: "2099-01-01T12:00:00Z" },
          { capacity: 2, startsAt: "2099-01-02T12:00:00Z" },
        ],
      })
      .expect(201)
  ).body.id;
  const slots = (
    await pool.query(
      "SELECT id FROM context_slots WHERE context_id=$1 ORDER BY starts_at",
      [context],
    )
  ).rows;
  const bookings: string[] = [];
  for (const slot of slots) {
    const id = (
      await api
        .post("/bookings")
        .set("Authorization", guest.auth)
        .send({ slotId: slot.id, partySize: 1 })
        .expect(201)
    ).body.id;
    await api
      .patch("/bookings/" + id + "/status")
      .set("Authorization", host.auth)
      .send({ status: "accepted" })
      .expect(200);
    bookings.push(id);
  }
  const pay = (id: string) =>
    api
      .post("/bookings/" + id + "/payment-intent")
      .set("Authorization", guest.auth);
  await pay(bookings[0]).expect(409, { error: "insufficient_balance" });
  const requestId = randomUUID();
  vi.spyOn(stripe.paymentIntents, "create").mockResolvedValue({
    id: "pi_test",
    client_secret: "client_test",
  } as never);
  await api
    .post("/me/wallet/topups")
    .set("Authorization", guest.auth)
    .send({ amountCents: 2000, requestId })
    .expect(201, { clientSecret: "client_test" });
  const topup = (
    await pool.query("SELECT id FROM wallet_topups WHERE request_id=$1", [
      requestId,
    ])
  ).rows[0].id;
  async function hook(type: string, object: object, connected = false) {
    const payload = JSON.stringify({
      type,
      livemode: false,
      ...(connected ? { account: "acct_test" } : {}),
      data: { object },
    });
    const sig = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: connected ? "whsec_connected" : "whsec_fixture",
    });
    await api
      .post(connected ? "/stripe/connect/webhook" : "/stripe/webhook")
      .set("content-type", "application/json")
      .set("stripe-signature", sig)
      .send(payload)
      .expect(200);
  }
  for (let i = 0; i < 2; i++)
    await hook("payment_intent.succeeded", {
      id: "pi_test",
      currency: "eur",
      amount_received: 2000,
      metadata: { topupId: topup },
    });
  const balance = async () =>
    (await api.get("/me/wallet").set("Authorization", guest.auth).expect(200))
      .body.balanceCents;
  expect(await balance()).toBe(2000);
  const attempts = await Promise.all(bookings.map(pay));
  expect(attempts.map((r) => r.status).sort()).toEqual([200, 409]);
  const winner = attempts.findIndex((r) => r.status === 200),
    other = 1 - winner;
  await pay(bookings[winner]).expect(200);
  expect(await balance()).toBe(800);
  const earnings = await api
    .get("/me/host/settlements")
    .set("Authorization", host.auth)
    .expect(200);
  expect(earnings.body.items).toEqual([
    { bookingId: bookings[winner], cents: 1200, state: "awaiting_meal" },
  ]);
  await api
    .delete("/me/account")
    .set("Authorization", host.auth)
    .send({ confirm: true })
    .expect(409, { error: "financial_operation_pending" });
  await api
    .patch("/bookings/" + bookings[winner] + "/status")
    .set("Authorization", guest.auth)
    .send({ status: "cancelled" })
    .expect(200);
  expect(await balance()).toBe(2000);
  await pay(bookings[other]).expect(200);
  await pool.query(
    "UPDATE context_slots SET starts_at=now()-interval '2 hours' WHERE id=$1",
    [slots[other].id],
  );
  await api
    .patch("/bookings/" + bookings[other] + "/status")
    .set("Authorization", host.auth)
    .send({ status: "completed" })
    .expect(200);
  vi.spyOn(stripe.accounts, "retrieve").mockResolvedValue({
    payouts_enabled: true,
    capabilities: { transfers: "active" },
  } as never);
  const transfer = vi
    .spyOn(stripe.transfers, "create")
    .mockResolvedValue({ id: "tr_test" } as never);
  vi.spyOn(stripe.balance, "retrieve").mockResolvedValue({
    available: [{ currency: "eur", amount: 1200 }],
  } as never);
  const payout = vi
    .spyOn(stripe.payouts, "create")
    .mockResolvedValue({ id: "po_test" } as never);
  transfer.mockRejectedValueOnce(new Error("response lost"));
  for (let i = 0; i < 5; i++) {
    await pool.query("UPDATE settlements SET next_attempt_at=now()");
    if (i === 1)
      await expect(settleNext(pool)).rejects.toThrow("response lost");
    else await settleNext(pool);
  }
  expect(transfer).toHaveBeenCalledTimes(2);
  expect(transfer.mock.calls[0]).toEqual(transfer.mock.calls[1]);
  expect(payout).toHaveBeenCalledTimes(1);
  await hook("payout.paid", { id: "po_test" }, true);
  const settlements = (auth: string) =>
    api.get("/me/host/settlements").set("Authorization", auth);
  await settlements(host.auth).expect(200, {
    items: [{ bookingId: bookings[other], cents: 1200, state: "paid" }],
  });
  await settlements(guest.auth).expect(200, { items: [] });
  await hook("payout.failed", { id: "po_test" }, true);
  expect((await settlements(host.auth)).body.items[0].state).toBe("failed");
  expect(await balance()).toBe(800);
}, 30000);
it("US18 / Portefeuille : les clés live sont refusées et les clés de test acceptées", () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_fixture");
  expect(() => gateway.testStripe()).toThrow("stripe_test_unavailable");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture");
  expect(gateway.testStripe()).toBeInstanceOf(Stripe);
});
it("US18 / Portefeuille : signature falsifiée, évènement live et confusion de comptes refusés", async () => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
  const api = client(),
    route = "/stripe/webhook";
  await api
    .post(route)
    .set("Stripe-Signature", "forged")
    .send({})
    .expect(400, { error: "invalid_signature" });
  for (const envelope of [
    { livemode: true },
    { livemode: false, account: "acct_wrong" },
  ]) {
    const payload = JSON.stringify({
      type: "payment_intent.succeeded",
      ...envelope,
    });
    const sig = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_fixture",
    });
    await api
      .post(route)
      .set("content-type", "application/json")
      .set("Stripe-Signature", sig)
      .send(payload)
      .expect(400, { error: "wrong_event_scope" });
  }
});

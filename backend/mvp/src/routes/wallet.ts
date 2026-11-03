import type pg from "pg";
import express, { type RequestHandler } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { testStripe } from "../stripe.js";
import { AuthError } from "../services/auth.js";
export function walletRoutes(db: pg.Pool, auth: RequestHandler) {
  const r = express.Router();
  r.get("/me/wallet", auth, async (_req, res) => {
    const entries = (
      await db.query(
        'SELECT kind,cents,reference,created_at AS "createdAt" FROM wallet_entries WHERE user_id=$1 ORDER BY id DESC',
        [res.locals.identity.user.id],
      )
    ).rows;
    res.json({
      currency: "eur",
      balanceCents: entries.reduce((sum, e) => sum + e.cents, 0),
      entries,
    });
  });
  r.post("/me/wallet/topups", auth, async (req, res) => {
    const { amountCents, requestId } = z
      .object({
        amountCents: z.number().int().min(50).max(100000),
        requestId: z.uuid(),
      })
      .strict()
      .parse(req.body);
    const stripe = testStripe();
    const row = (
      await db.query(
        "INSERT INTO wallet_topups(user_id,request_id,cents) VALUES($1,$2,$3) ON CONFLICT(user_id,request_id) DO UPDATE SET request_id=excluded.request_id RETURNING id,cents,intent_id,created_at",
        [res.locals.identity.user.id, requestId, amountCents],
      )
    ).rows[0];
    if (row.cents !== amountCents) throw new AuthError(409, "amount_mismatch");
    if (!row.intent_id && Date.now() - row.created_at.getTime() > 23 * 3600000)
      throw new AuthError(409, "topup_expired");
    const intent = row.intent_id
      ? await stripe.paymentIntents.retrieve(row.intent_id)
      : await stripe.paymentIntents.create(
          {
            amount: amountCents,
            currency: "eur",
            payment_method_types: ["card"],
            metadata: { topupId: row.id },
          },
          { idempotencyKey: "topup-" + row.id },
        );
    await db.query("UPDATE wallet_topups SET intent_id=$2 WHERE id=$1", [
      row.id,
      intent.id,
    ]);
    res.status(201).json({ clientSecret: intent.client_secret });
  });
  r.post("/me/host/onboarding", auth, async (_req, res) => {
    const host = res.locals.identity.user.id;
    if (
      !(await db.query("SELECT 1 FROM host_profiles WHERE user_id=$1", [host]))
        .rowCount
    )
      throw new AuthError(403, "host_required");
    const stripe = testStripe(),
      origin = process.env.APP_ORIGIN;
    if (!origin) throw new AuthError(503, "onboarding_unconfigured");
    let account = (
      await db.query("SELECT account FROM connect_accounts WHERE host_id=$1", [
        host,
      ])
    ).rows[0]?.account;
    if (!account) {
      const created = await stripe.accounts.create(
        {
          type: "express",
          country: "FR",
          capabilities: { transfers: { requested: true } },
          settings: { payouts: { schedule: { interval: "manual" } } },
        },
        { idempotencyKey: "host-" + host },
      );
      account = (
        await db.query(
          "INSERT INTO connect_accounts VALUES($1,$2) ON CONFLICT(host_id) DO UPDATE SET host_id=excluded.host_id RETURNING account",
          [host, created.id],
        )
      ).rows[0].account;
    }
    const link = await stripe.accountLinks.create({
      account,
      type: "account_onboarding",
      return_url: new URL("/hote/paiements", origin).href,
      refresh_url: new URL("/hote/paiements?retry=1", origin).href,
    });
    res.json({ url: link.url });
  });
  r.get("/me/host/settlements", auth, async (_req, res) =>
    res.json({
      items: (
        await db.query(
          `SELECT booking_id AS "bookingId",cents,state FROM settlements WHERE host_id=$1
             UNION ALL SELECT b.id,b.amount_cents,'awaiting_meal' FROM bookings b
             JOIN context_slots s ON s.id=b.slot_id JOIN contexts c ON c.id=s.context_id
             WHERE c.host_id=$1 AND b.status='accepted' AND b.payment_intent_status='paid'
             ORDER BY "bookingId"`,
          [res.locals.identity.user.id],
        )
      ).rows,
    }),
  );
  return r;
}
export function stripeWebhook(db: pg.Pool, connect: boolean): RequestHandler {
  return async (req, res) => {
    const sig = req.get("stripe-signature");
    if (!sig) throw new AuthError(400, "invalid_signature");
    const secret = connect
      ? process.env.STRIPE_CONNECT_WEBHOOK_SECRET
      : process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new AuthError(503, "webhook_unconfigured");
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch {
      throw new AuthError(400, "invalid_signature");
    }
    if (event.livemode || Boolean(event.account) !== connect)
      throw new AuthError(400, "wrong_event_scope");
    if (!connect && event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      if (pi.currency === "eur" && pi.metadata.topupId)
        await db.query(
          `INSERT INTO wallet_entries(user_id,kind,cents,reference)
   SELECT user_id,'credit',cents,id::text FROM wallet_topups WHERE id::text=$1 AND cents=$2 AND (intent_id IS NULL OR intent_id=$3) ON CONFLICT(kind,reference) DO NOTHING`,
          [pi.metadata.topupId, pi.amount_received, pi.id],
        );
    }
    if (
      connect &&
      (event.type === "payout.paid" || event.type === "payout.failed")
    ) {
      const p = event.data.object;
      await db.query(
        `UPDATE settlements s SET state=$1 FROM connect_accounts a WHERE s.host_id=a.host_id AND a.account=$2 AND s.payout_id=$3 AND s.state IN ('processing','paid')`,
        [event.type === "payout.paid" ? "paid" : "failed", event.account, p.id],
      );
    }
    res.sendStatus(200);
  };
}

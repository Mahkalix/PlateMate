import type pg from "pg";
import type Stripe from "stripe";
import { testStripe } from "../stripe.js";

type Settlement = {
  booking_id: string;
  account: string;
  cents: number;
  state: "pending" | "transferred" | "processing";
  payout_id: string;
  attempted_at: Date | null;
};

async function ready(stripe: Stripe, row: Settlement) {
  const account = await stripe.accounts.retrieve(row.account);
  if (row.state === "pending")
    return account.capabilities?.transfers === "active";
  if (!account.payouts_enabled) return false;
  const balance = await stripe.balance.retrieve({ stripeAccount: row.account });
  return balance.available.some(
    (b) => b.currency === "eur" && b.amount >= row.cents,
  );
}

async function process(c: pg.PoolClient, row: Settlement) {
  const stripe = testStripe();
  if (row.state === "processing") {
    const payout = await stripe.payouts.retrieve(row.payout_id, {
      stripeAccount: row.account,
    });
    if (payout.status === "paid" || payout.status === "failed")
      await c.query("UPDATE settlements SET state=$2 WHERE booking_id=$1", [
        row.booking_id,
        payout.status,
      ]);
    return;
  }
  // Commit a first-attempt timestamp before any money movement. On an ambiguous
  // response, replay the same operation without rechecking its pre-debit balance.
  if (!row.attempted_at) {
    if (await ready(stripe, row))
      await c.query(
        "UPDATE settlements SET attempted_at=now() WHERE booking_id=$1",
        [row.booking_id],
      );
    return;
  }
  if (row.state === "pending") {
    const transfer = await stripe.transfers.create(
      {
        amount: row.cents,
        currency: "eur",
        destination: row.account,
        transfer_group: row.booking_id,
      },
      { idempotencyKey: "transfer-" + row.booking_id },
    );
    await c.query(
      "UPDATE settlements SET state='transferred',transfer_id=$2,attempted_at=NULL WHERE booking_id=$1",
      [row.booking_id, transfer.id],
    );
    return;
  }
  const payout = await stripe.payouts.create(
    {
      amount: row.cents,
      currency: "eur",
      metadata: { bookingId: row.booking_id },
    },
    { stripeAccount: row.account, idempotencyKey: "payout-" + row.booking_id },
  );
  await c.query(
    "UPDATE settlements SET state='processing',payout_id=$2 WHERE booking_id=$1",
    [row.booking_id, payout.id],
  );
}

export async function settleNext(db: pg.Pool) {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const row = (
      await c.query<Settlement>(`SELECT s.*,a.account FROM settlements s JOIN connect_accounts a ON a.host_id=s.host_id
    WHERE next_attempt_at<=now() AND state IN ('pending','transferred','processing')
    AND (state='processing' OR attempted_at IS NULL OR attempted_at>now()-interval '23 hours')
    ORDER BY next_attempt_at,booking_id LIMIT 1 FOR UPDATE OF s SKIP LOCKED`)
    ).rows[0];
    if (row) {
      await c.query(
        "UPDATE settlements SET next_attempt_at=now()+interval '30 seconds' WHERE booking_id=$1",
        [row.booking_id],
      );
      await c.query("SAVEPOINT movement");
      try {
        await process(c, row);
      } catch (err) {
        await c.query("ROLLBACK TO SAVEPOINT movement");
        await c.query("COMMIT");
        throw err;
      }
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

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

async function canStartMovement(stripe: Stripe, settlement: Settlement) {
  const account = await stripe.accounts.retrieve(settlement.account);
  if (settlement.state === "pending")
    return account.capabilities?.transfers === "active";
  if (!account.payouts_enabled) return false;
  const balance = await stripe.balance.retrieve({
    stripeAccount: settlement.account,
  });
  return balance.available.some(
    (funds) => funds.currency === "eur" && funds.amount >= settlement.cents,
  );
}

async function advanceSettlement(
  client: pg.PoolClient,
  settlement: Settlement,
) {
  const stripe = testStripe();
  if (settlement.state === "processing") {
    const payout = await stripe.payouts.retrieve(settlement.payout_id, {
      stripeAccount: settlement.account,
    });
    if (payout.status === "paid" || payout.status === "failed")
      await client.query(
        "UPDATE settlements SET state=$2 WHERE booking_id=$1",
        [settlement.booking_id, payout.status],
      );
    return;
  }
  // On enregistre la première tentative avant de contacter Stripe. Si sa réponse
  // se perd, la tentative suivante réutilise la même clé pour éviter un double paiement.
  if (!settlement.attempted_at) {
    if (await canStartMovement(stripe, settlement))
      await client.query(
        "UPDATE settlements SET attempted_at=now() WHERE booking_id=$1",
        [settlement.booking_id],
      );
    return;
  }
  if (settlement.state === "pending") {
    const transfer = await stripe.transfers.create(
      {
        amount: settlement.cents,
        currency: "eur",
        destination: settlement.account,
        transfer_group: settlement.booking_id,
      },
      { idempotencyKey: "transfer-" + settlement.booking_id },
    );
    await client.query(
      "UPDATE settlements SET state='transferred',transfer_id=$2,attempted_at=NULL WHERE booking_id=$1",
      [settlement.booking_id, transfer.id],
    );
    return;
  }
  const payout = await stripe.payouts.create(
    {
      amount: settlement.cents,
      currency: "eur",
      metadata: { bookingId: settlement.booking_id },
    },
    {
      stripeAccount: settlement.account,
      idempotencyKey: "payout-" + settlement.booking_id,
    },
  );
  await client.query(
    "UPDATE settlements SET state='processing',payout_id=$2 WHERE booking_id=$1",
    [settlement.booking_id, payout.id],
  );
}

export async function settleNext(db: pg.Pool) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<Settlement>(`
      SELECT s.*, a.account
      FROM settlements s
      JOIN connect_accounts a ON a.host_id = s.host_id
      WHERE next_attempt_at <= now()
        AND state IN ('pending', 'transferred', 'processing')
        AND (state = 'processing' OR attempted_at IS NULL
             OR attempted_at > now() - interval '23 hours')
      ORDER BY next_attempt_at, booking_id
      LIMIT 1 FOR UPDATE OF s SKIP LOCKED
    `);
    const settlement = result.rows[0];
    if (settlement) {
      await client.query(
        "UPDATE settlements SET next_attempt_at=now()+interval '30 seconds' WHERE booking_id=$1",
        [settlement.booking_id],
      );
      // En cas d’échec, conserver le délai avant la prochaine tentative.
      await client.query("SAVEPOINT movement");
      try {
        await advanceSettlement(client, settlement);
      } catch (err) {
        await client.query("ROLLBACK TO SAVEPOINT movement");
        await client.query("COMMIT");
        throw err;
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

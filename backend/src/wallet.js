import express from 'express';
import { randomUUID } from 'node:crypto';

export function walletRoutes(pool, requireUser, stripe) {
  const router = express.Router();
  router.get('/wallet', requireUser, async (req, res, next) => {
    try {
      const { rows } = await pool.query(`SELECT COALESCE(SUM(amount_cents) FILTER (WHERE state='pending'),0)::integer AS "pendingCents",
        COALESCE(SUM(amount_cents) FILTER (WHERE state='available'),0)::integer AS "availableCents",
        COALESCE(SUM(amount_cents) FILTER (WHERE state='transfer_pending'),0)::integer AS "withdrawalPendingCents",
        COALESCE(SUM(amount_cents) FILTER (WHERE state='transferred'),0)::integer AS "transferredCents" FROM wallet_entries WHERE host_id=$1`, [req.user.id]);
      const entries = await pool.query(`SELECT w.booking_id AS "bookingId",w.amount_cents AS "amountCents",w.state,w.available_at AS "availableAt",w.updated_at AS "updatedAt" FROM wallet_entries w WHERE host_id=$1 ORDER BY w.updated_at DESC LIMIT 100`, [req.user.id]);
      const payouts = await pool.query('SELECT id,amount_cents AS "amountCents",state,created_at AS "createdAt" FROM wallet_payouts WHERE host_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
      res.json({ currency:'eur', ...rows[0], entries:entries.rows, withdrawals:payouts.rows });
    } catch (error) { next(error); }
  });
  router.post('/connect/onboarding', requireUser, async (req, res, next) => {
    if (!stripe) return res.status(503).json({ error:'Stripe indisponible' });
    try {
      const host = await pool.query('SELECT 1 FROM experiences WHERE host_id=$1 LIMIT 1', [req.user.id]);
      if (!host.rowCount) return res.status(403).json({ error:'Profil hôte requis' });
      let account = (await pool.query('SELECT stripe_account_id FROM host_connect_accounts WHERE user_id=$1', [req.user.id])).rows[0]?.stripe_account_id;
      if (!account) {
        const created = await stripe.accounts.create({ country:'FR', email:req.user.email || undefined,
          controller:{ stripe_dashboard:{ type:'express' }, fees:{ payer:'application' }, losses:{ payments:'application' } },
          capabilities:{ transfers:{ requested:true } }, settings:{ payouts:{ schedule:{ interval:'manual' } } },
          metadata:{ userId:req.user.id } }, { idempotencyKey:`host-account-${req.user.id}` });
        account = created.id;
        await pool.query('INSERT INTO host_connect_accounts(user_id,stripe_account_id) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING', [req.user.id,account]);
      }
      const link = await stripe.accountLinks.create({ account, type:'account_onboarding',
        refresh_url:`${process.env.APP_ORIGIN}/hote/paiements?onboarding=retry`,
        return_url:`${process.env.APP_ORIGIN}/hote/paiements?onboarding=return` });
      res.json({ url:link.url });
    } catch (error) { next(error); }
  });
  router.get('/connect/status', requireUser, async (req, res, next) => {
    try {
      const accountId = (await pool.query('SELECT stripe_account_id FROM host_connect_accounts WHERE user_id=$1', [req.user.id])).rows[0]?.stripe_account_id;
      if (!accountId) return res.json({ connected:false, transfersEnabled:false });
      const account = await stripe.accounts.retrieve(accountId);
      res.json({ connected:true, transfersEnabled:Boolean(account.payouts_enabled && account.capabilities?.transfers === 'active'), requirements: account.requirements?.currently_due || [] });
    } catch (error) { next(error); }
  });
  router.post('/wallet/withdrawals', requireUser, async (req, res, next) => {
    if (!stripe) return res.status(503).json({ error:'Stripe indisponible' });
    const client = await pool.connect();
    let payoutId;
    try {
      await client.query('BEGIN');
      const account = (await client.query('SELECT stripe_account_id FROM host_connect_accounts WHERE user_id=$1 FOR UPDATE', [req.user.id])).rows[0];
      if (!account) { await client.query('ROLLBACK'); return res.status(409).json({ error:'Onboarding Stripe requis' }); }
      if ((await client.query("SELECT 1 FROM wallet_payouts WHERE host_id=$1 AND state='processing'", [req.user.id])).rowCount) {
        await client.query('ROLLBACK'); return res.status(409).json({ error:'Retrait déjà en cours' });
      }
      const entries = (await client.query("SELECT booking_id,amount_cents FROM wallet_entries WHERE host_id=$1 AND state='available' ORDER BY booking_id FOR UPDATE", [req.user.id])).rows;
      if (!entries.length) { await client.query('ROLLBACK'); return res.status(409).json({ error:'Solde disponible insuffisant' }); }
      payoutId = randomUUID();
      await client.query('INSERT INTO wallet_payouts(id,host_id,amount_cents,state) VALUES($1,$2,$3,\'processing\')', [payoutId,req.user.id,entries.reduce((sum,e)=>sum+e.amount_cents,0)]);
      for (const entry of entries) await client.query('INSERT INTO wallet_payout_entries(payout_id,booking_id) VALUES($1,$2)', [payoutId,entry.booking_id]);
      await client.query("UPDATE wallet_entries SET state='transfer_pending',updated_at=now() WHERE booking_id=ANY($1::uuid[])", [entries.map(e=>e.booking_id)]);
      await client.query('COMMIT');
      // Idempotency across retries is tied to the persisted withdrawal ID.
      const result = await processWithdrawal(pool,stripe,payoutId,req.user.id);
      res.status(202).json(result);
    } catch (error) { await client.query('ROLLBACK').catch(()=>{}); next(error); }
    finally { client.release(); }
  });
  router.post('/wallet/withdrawals/:id/retry', requireUser, async (req,res,next) => {
    if (!stripe || !/^[a-f\d-]{36}$/.test(req.params.id)) return res.status(400).json({ error:'Retrait invalide' });
    try {
      await pool.query("UPDATE wallet_payouts SET state='processing',stripe_payout_id=NULL,attempt=attempt+1 WHERE id=$1 AND host_id=$2 AND state='failed'", [req.params.id,req.user.id]);
      res.json(await processWithdrawal(pool,stripe,req.params.id,req.user.id));
    }
    catch (error) { next(error); }
  });
  return router;
}

export async function processWithdrawal(pool,stripe,id,hostId) {
  const payout = (await pool.query(`SELECT p.*,a.stripe_account_id FROM wallet_payouts p JOIN host_connect_accounts a ON a.user_id=p.host_id WHERE p.id=$1 AND p.host_id=$2 AND p.state='processing'`, [id,hostId])).rows[0];
  if (!payout) throw Object.assign(new Error('Retrait indisponible'), { status:409 });
  const account = await stripe.accounts.retrieve(payout.stripe_account_id);
  if (!account.payouts_enabled || account.capabilities?.transfers !== 'active') throw Object.assign(new Error('Compte Stripe non vérifié'), { status:409 });
  const entries = (await pool.query(`SELECT w.booking_id,w.amount_cents,w.stripe_transfer_id,b.stripe_charge_id FROM wallet_payout_entries pe JOIN wallet_entries w ON w.booking_id=pe.booking_id JOIN bookings b ON b.id=w.booking_id WHERE pe.payout_id=$1 ORDER BY w.booking_id`, [id])).rows;
  for (const entry of entries) {
    if (entry.stripe_transfer_id) continue;
    if (!entry.stripe_charge_id) throw new Error('Charge Stripe absente');
    const transfer = await stripe.transfers.create({ amount:entry.amount_cents,currency:'eur',destination:payout.stripe_account_id,
      source_transaction:entry.stripe_charge_id,metadata:{bookingId:entry.booking_id,payoutId:id} }, { idempotencyKey:`transfer-${entry.booking_id}` });
    await pool.query("UPDATE wallet_entries SET stripe_transfer_id=$2,updated_at=now() WHERE booking_id=$1 AND state='transfer_pending'", [entry.booking_id,transfer.id]);
  }
  if (!payout.stripe_payout_id) {
    const balance = await stripe.balance.retrieve({}, { stripeAccount:payout.stripe_account_id });
    const available = balance.available.filter(item=>item.currency==='eur').reduce((sum,item)=>sum+item.amount,0);
    if (available < payout.amount_cents) return { id,state:'processing',amountCents:payout.amount_cents,awaitingFunds:true };
    const created = await stripe.payouts.create({ amount:payout.amount_cents,currency:'eur',metadata:{payoutId:id} },
      { stripeAccount:payout.stripe_account_id,idempotencyKey:`payout-${id}-${payout.attempt}` });
    await pool.query('UPDATE wallet_payouts SET stripe_payout_id=$2 WHERE id=$1 AND stripe_payout_id IS NULL', [id,created.id]);
  }
  return { id,state:'processing',amountCents:payout.amount_cents };
}

export async function handlePayoutEvent(client,event) {
  const payout = event.data.object;
  const id = payout.metadata?.payoutId;
  if (!id) return;
  const state = event.type === 'payout.paid' ? 'paid' : 'failed';
  const updated = await client.query("UPDATE wallet_payouts SET state=$3 WHERE id=$1 AND stripe_payout_id=$2 AND state='processing' RETURNING id", [id,payout.id,state]);
  if (updated.rowCount) await client.query(`UPDATE wallet_entries SET state=$2,updated_at=now() WHERE booking_id IN (SELECT booking_id FROM wallet_payout_entries WHERE payout_id=$1)`, [id,state==='paid'?'transferred':'transfer_pending']);
}

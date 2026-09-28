import pg from 'pg';
import { migrate } from './migrations.js';
import Stripe from 'stripe';
import { processWithdrawal, handlePayoutEvent } from './wallet.js';
import { requestRefund } from './experiences.js';
import { assertStripeTestKey } from './stripe-test-mode.js';

export async function settleExperiences(pool) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE bookings SET status='cancelled',cancelled_at=now()
      WHERE status='accepted' AND accepted_at < now()-interval '24 hours'`);
    await client.query(`UPDATE wallet_entries w SET state='available',updated_at=now()
      FROM bookings b,experience_dates d WHERE w.booking_id=b.id AND b.date_id=d.id
      AND w.state='pending' AND b.status='paid' AND w.available_at<=now()
      AND NOT EXISTS (SELECT 1 FROM bookings disputed WHERE disputed.id=b.id AND disputed.status='disputed')`);
    await client.query(`UPDATE bookings b SET status='completed' FROM experience_dates d
      WHERE b.date_id=d.id AND b.status='paid' AND d.starts_at+interval '48 hours'<=now()`);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

if (process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL requis');
  assertStripeTestKey(process.env.STRIPE_SECRET_KEY);
  const pool=new pg.Pool({ connectionString:process.env.DATABASE_URL });
  try {
    await migrate(pool);
    const stripe=process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
    const tick=async()=>{
      await settleExperiences(pool);
      if (stripe) {
        const { rows }=await pool.query("SELECT id,host_id FROM wallet_payouts WHERE state='processing' ORDER BY created_at LIMIT 50");
        for (const row of rows) try {
          await processWithdrawal(pool,stripe,row.id,row.host_id);
          const payout=(await pool.query('SELECT stripe_payout_id,stripe_account_id FROM wallet_payouts p JOIN host_connect_accounts a ON a.user_id=p.host_id WHERE p.id=$1',[row.id])).rows[0];
          if (payout?.stripe_payout_id) {
            const actual=await stripe.payouts.retrieve(payout.stripe_payout_id,{stripeAccount:payout.stripe_account_id});
            if (['paid','failed'].includes(actual.status)) {
              const client=await pool.connect();
              try { await client.query('BEGIN'); await handlePayoutEvent(client,{type:`payout.${actual.status}`,data:{object:actual}}); await client.query('COMMIT'); }
              catch(error){await client.query('ROLLBACK');throw error;}
              finally{client.release();}
            }
          }
        }
        catch (error) { console.error('Retrait à réessayer',row.id,error.message); }
        const pending=(await pool.query("SELECT id,stripe_payment_intent_id,refund_attempt FROM bookings WHERE status='refund_pending' ORDER BY cancelled_at LIMIT 50")).rows;
        for (const booking of pending) try {
          const refund=await requestRefund(stripe,booking);
          if (refund.status==='succeeded') {
            const client=await pool.connect();
            try { await client.query('BEGIN');
              const result=await client.query("UPDATE bookings SET status='refunded',stripe_refund_id=$2 WHERE id=$1 AND status='refund_pending' RETURNING id",[booking.id,refund.id]);
              if(result.rowCount)await client.query("UPDATE wallet_entries SET state='reversed',updated_at=now() WHERE booking_id=$1 AND state IN ('pending','available')",[booking.id]);
              await client.query('COMMIT');
            } catch(error){await client.query('ROLLBACK');throw error;} finally{client.release();}
          } else if(refund.status==='failed') await pool.query("UPDATE bookings SET status='paid' WHERE id=$1 AND status='refund_pending'",[booking.id]);
        } catch(error){console.error('Remboursement à réessayer',booking.id,error.message);}
      }
    };
    await tick();
    if (process.argv.includes('--loop')) {
      let running=true;
      process.on('SIGTERM',()=>{running=false;});
      process.on('SIGINT',()=>{running=false;});
      while (running) { await new Promise(resolve=>setTimeout(resolve,60000)); if (running) await tick(); }
    }
  }
  finally { await pool.end(); }
}

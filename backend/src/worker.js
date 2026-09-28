import pg from 'pg';
import { migrate } from './migrations.js';
import Stripe from 'stripe';
import { processWithdrawal } from './wallet.js';

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
  const pool=new pg.Pool({ connectionString:process.env.DATABASE_URL });
  try {
    await migrate(pool);
    const stripe=process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
    const tick=async()=>{
      await settleExperiences(pool);
      if (stripe) {
        const { rows }=await pool.query("SELECT id,host_id FROM wallet_payouts WHERE state='processing' ORDER BY created_at LIMIT 50");
        for (const row of rows) try { await processWithdrawal(pool,stripe,row.id,row.host_id); }
        catch (error) { console.error('Retrait à réessayer',row.id,error.message); }
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

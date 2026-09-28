import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import express from 'express';
import Stripe from 'stripe';
import { experienceRoutes, stripeWebhook } from '../src/experiences.js';

async function serve(app, run) {
  const server = app.listen(0);
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('checkout refusé avant acceptation de la réservation', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  let created = false;
  const client = {
    query: async sql => {
      if (sql.includes('SELECT b.*')) return { rows: [{ id, status: 'requested', starts_at: '2030-01-01T12:00:00Z' }] };
      return { rows: [] };
    }, release() {}
  };
  const pool = { connect: async () => client };
  const stripe = { checkout: { sessions: { create: async () => { created = true; } } } };
  const app = express();
  app.use(express.json());
  app.use('/api', experienceRoutes(pool, (req, _res, next) => { req.user = { id, email: 'test@example.com' }; next(); }, stripe));
  await serve(app, async url => {
    const res = await fetch(`${url}/api/bookings/${id}/checkout`, { method: 'POST' });
    assert.equal(res.status, 409);
    assert.equal(created, false);
  });
});

test('webhook signé crédite le portefeuille une seule fois après paiement Stripe confirmé', async () => {
  const secret = 'whsec_testing';
  const sdk = new Stripe('sk_test_testing');
  const queries = [];
  let processed = false;
  const client = { query:async (sql,args) => {
    queries.push([sql,args]);
    if (sql.includes('INSERT INTO stripe_events')) return { rows:[{ processed_at:processed ? new Date() : null }] };
    if (sql.includes("SET status='paid'")) return { rows:[{ id:'booking-id' }],rowCount:1 };
    if (sql.includes('processed_at=now()')) processed=true;
    return { rows:[],rowCount:0 };
  },release() {} };
  const pool = { connect:async()=>client };
  const stripe = { webhooks:sdk.webhooks,paymentIntents:{ retrieve:async()=>({ id:'pi_test_1',status:'succeeded',amount_received:3200,latest_charge:'ch_test_1' }) } };
  const app = express();
  app.post('/webhook', express.raw({ type:'application/json' }),stripeWebhook(pool,stripe,secret));
  const payload=JSON.stringify({ id:'evt_test',type:'checkout.session.completed',data:{object:{ id:'cs_test_1',client_reference_id:'booking-id',payment_status:'paid',currency:'eur',amount_total:3200,payment_intent:'pi_test_1' }} });
  await serve(app,async url=>{
    const invalid=await fetch(`${url}/webhook`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':'invalid'},body:payload});
    assert.equal(invalid.status,400);
    const signature=sdk.webhooks.generateTestHeaderString({payload,secret});
    for (let i=0;i<2;i++) {
      const valid=await fetch(`${url}/webhook`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body:payload});
      assert.equal(valid.status,200);
    }
    assert.equal(queries.filter(([sql])=>sql.includes('INSERT INTO wallet_entries')).length,1);
    assert.deepEqual(queries.find(([sql])=>sql.includes("SET status='paid'"))[1],['booking-id','cs_test_1','pi_test_1',3200,'ch_test_1']);
  });
});

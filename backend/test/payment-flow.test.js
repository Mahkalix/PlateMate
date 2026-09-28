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

test('webhook signé marque payée uniquement la réservation et le montant correspondant', async () => {
  const secret = 'whsec_testing';
  const stripe = new Stripe('sk_test_testing');
  const queries = [];
  const pool = { query: async (...args) => { queries.push(args); return { rowCount: 1 }; } };
  const app = express();
  app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook(pool, stripe, secret));
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', client_reference_id: 'booking-id', payment_status: 'paid', currency: 'eur', amount_total: 3200, payment_intent: 'pi_test_1' } } });
  await serve(app, async url => {
    const invalid = await fetch(`${url}/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': 'invalid' }, body: payload });
    assert.equal(invalid.status, 400);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const valid = await fetch(`${url}/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': signature }, body: payload });
    assert.equal(valid.status, 200);
    assert.equal(queries.length, 1);
    assert.deepEqual(queries[0][1], ['booking-id', 'cs_test_1', 'pi_test_1', 3200]);
    assert.match(queries[0][0], /status = 'checkout_pending' AND total_cents = \$4/);
  });
});

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import pg from 'pg';
import express from 'express';
import Stripe from 'stripe';
import { stripeWebhook } from '../src/experiences.js';
import { runDemo } from '../scripts/demo.mjs';
import { migrate } from '../src/migrations.js';

test('parcours PostgreSQL : hôte, expérience, invité, demande et capacité', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.NODE_ENV = 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.APP_ORIGIN;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await migrate(pool);
  await migrate(pool);
  const { app } = await import('../src/server.js');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, method = 'GET', body, cookie) => {
    const response = await fetch(base + path, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const suffix = Date.now().toString(36);
    const host = await request('/api/auth/register', 'POST', { email: `host-${suffix}@example.com`, password: 'a-long-password' });
    assert.equal(host.status, 201);
    assert.equal((await request('/api/profile', 'PUT', {
      displayName: 'Hôte', city: 'Grenoble', photoUrl: 'https://example.com/host.jpg', languages: ['Français'],
      interests: ['Musique'], bio: 'Cuisine familiale', allergies: ['arachides'], dietaryPreferences: ['vegan']
    }, host.cookie)).status, 200);
    const experience = await request('/api/experiences', 'POST', {
      title: 'Repas partagé', city: 'Grenoble', cuisine: 'Marocaine', menuPriceCents: 2800,
      theme: 'Découverte', atmosphere: 'Calme', dietaryOptions: ['Vegan', 'sans-gluten']
    }, host.cookie);
    assert.equal(experience.status, 201);
    const date = await request(`/api/experiences/${experience.body.id}/dates`, 'POST', { startsAt: '2030-12-01T19:00:00+01:00', capacity: 2 }, host.cookie);
    assert.equal(date.status, 201);
    assert.equal((await request(`/api/experiences/${experience.body.id}/publish`, 'POST',null,host.cookie)).status,409);
    assert.equal((await request(`/api/experiences/${experience.body.id}/menu`,'POST',{title:'Couscous',position:0},host.cookie)).status,201);
    assert.equal((await request(`/api/experiences/${experience.body.id}/publish`, 'POST',null,host.cookie)).status,200);
    const filters = new URLSearchParams({ city: 'grenoble', cuisine: 'Marocaine', theme: 'Découverte', atmosphere: 'calme', language: 'français', diet: 'vegan,sans-gluten', guests: '2', date: '2030-12-01' });
    const search = await request(`/api/experiences?${filters}`);
    assert.equal(search.status, 200);
    assert.equal(search.body.experiences.length, 1);
    const card = search.body.experiences[0];
    assert.equal(card.id, experience.body.id);
    assert.equal(card.hostPhotoUrl, 'https://example.com/host.jpg');
    assert.deepEqual(card.hostInterests, ['Musique']);
    for (const field of ['score', 'allergies', 'dietaryPreferences', 'email']) assert.equal(field in card, false);
    assert.equal((await request('/api/discover?' + filters)).body.experiences[0].id, card.id);
    for (const [key, value] of [['diet', 'halal'], ['theme', 'Autre'], ['atmosphere', 'Festive'], ['guests', '3'], ['date', '2030-12-02'], ['city', '%']]) {
      const mismatch = new URLSearchParams(filters);
      mismatch.set(key, value);
      assert.equal((await request(`/api/experiences?${mismatch}`)).body.experiences.length, 0, `${key} doit exclure cette expérience`);
    }
    const guest = await request('/api/auth/register', 'POST', { email: `guest-${suffix}@example.com`, password: 'another-long-password' });
    const booking = await request('/api/bookings', 'POST', { dateId: date.body.id, guests: 2 }, guest.cookie);
    assert.equal(booking.status, 201);
    assert.equal(booking.body.quote.totalCents, 6400);
    assert.equal((await request(`/api/experiences/${experience.body.id}/dates/${date.body.id}`,'PUT',{startsAt:'2030-12-02T19:00:00+01:00',capacity:3},host.cookie)).status,409);
    assert.equal((await request(`/api/bookings/${booking.body.id}/messages`,'POST',{body:'Bonjour, à bientôt !'},guest.cookie)).status,201);
    assert.equal((await request(`/api/bookings/${booking.body.id}/messages`,'GET',null,host.cookie)).body.messages.length,1);
    assert.equal((await request(`/api/bookings/${booking.body.id}/review`,'POST',{rating:5},guest.cookie)).status,409);
    assert.equal((await request('/api/wallet','GET',null,host.cookie)).body.availableCents,0);
    assert.equal((await request(`/api/bookings/${booking.body.id}/checkout`, 'POST', null, guest.cookie)).status, 503);
    assert.equal((await request(`/api/bookings/${booking.body.id}/accept`, 'POST', null, host.cookie)).status, 200);
    const detail = await request(`/api/experiences/${experience.body.id}`);
    assert.equal(detail.body.dates[0].placesRemaining, 0);
    assert.equal((await request(`/api/experiences?${filters}`)).body.experiences.length, 0, 'Une table complète est exclue');
    const second = await request('/api/bookings', 'POST', { dateId: date.body.id, guests: 1 }, guest.cookie);
    assert.equal((await request(`/api/bookings/${second.body.id}/accept`, 'POST', null, host.cookie)).status, 409);
    assert.equal((await request(`/api/bookings/${second.body.id}/cancel`,'POST',null,guest.cookie)).body.status,'cancelled');
    const sessionId=`cs_integration_${suffix}`;
    await pool.query("UPDATE bookings SET status='checkout_pending',stripe_session_id=$2 WHERE id=$1",[booking.body.id,sessionId]);
    const sdk = new Stripe('sk_test_testing');
    const fakeStripe={ webhooks:sdk.webhooks,paymentIntents:{ retrieve:async()=>({id:`pi_integration_${suffix}`,status:'succeeded',amount_received:6400,latest_charge:`ch_integration_${suffix}`}) } };
    const secret='whsec_integration';
    const webhookApp=express().post('/webhook',express.raw({type:'application/json'}),stripeWebhook(pool,fakeStripe,secret));
    const webhookServer=webhookApp.listen(0);
    try {
      const send=async(event)=>{
        const payload=JSON.stringify(event);
        const signature=sdk.webhooks.generateTestHeaderString({payload,secret});
        return fetch(`http://127.0.0.1:${webhookServer.address().port}/webhook`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body:payload});
      };
      const paid={id:`evt_paid_${suffix}`,livemode:false,type:'checkout.session.completed',data:{object:{id:sessionId,client_reference_id:booking.body.id,payment_status:'paid',currency:'eur',amount_total:6400,payment_intent:`pi_integration_${suffix}`}}};
      assert.equal((await send(paid)).status,200);
      assert.equal((await send(paid)).status,200);
      assert.equal((await request('/api/wallet','GET',null,host.cookie)).body.pendingCents,5600);
      assert.equal((await pool.query('SELECT count(*)::integer AS count FROM wallet_entries WHERE booking_id=$1',[booking.body.id])).rows[0].count,1);
      await pool.query("UPDATE bookings SET status='refund_pending' WHERE id=$1",[booking.body.id]);
      assert.equal((await send({id:`evt_refund_${suffix}`,livemode:false,type:'refund.updated',data:{object:{id:'re_integration',metadata:{bookingId:booking.body.id},status:'succeeded',amount:6400}}})).status,200);
      assert.equal((await request('/api/wallet','GET',null,host.cookie)).body.pendingCents,0);
    } finally { await new Promise(resolve=>webhookServer.close(resolve)); }
    const demo = await runDemo({ baseUrl: base, log: () => {} });
    assert.ok(demo.experienceId);
    assert.ok(demo.bookingId);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});

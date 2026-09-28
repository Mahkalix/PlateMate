import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { runDemo } from '../scripts/demo.mjs';

test('parcours PostgreSQL : hôte, expérience, invité, demande et capacité', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.NODE_ENV = 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.APP_ORIGIN;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  for (const migration of ['001_initial.sql', '002_discoverable.sql', '003_experiences_bookings.sql', '004_profile_preferences.sql', '005_experience_filters.sql']) {
    await pool.query(await readFile(new URL(`../sql/${migration}`, import.meta.url), 'utf8'));
  }
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
    assert.equal((await request(`/api/bookings/${booking.body.id}/checkout`, 'POST', null, guest.cookie)).status, 503);
    assert.equal((await request(`/api/bookings/${booking.body.id}/accept`, 'POST', null, host.cookie)).status, 200);
    const detail = await request(`/api/experiences/${experience.body.id}`);
    assert.equal(detail.body.dates[0].placesRemaining, 0);
    assert.equal((await request(`/api/experiences?${filters}`)).body.experiences.length, 0, 'Une table complète est exclue');
    const second = await request('/api/bookings', 'POST', { dateId: date.body.id, guests: 1 }, guest.cookie);
    assert.equal((await request(`/api/bookings/${second.body.id}/accept`, 'POST', null, host.cookie)).status, 409);
    const demo = await runDemo({ baseUrl: base, log: () => {} });
    assert.ok(demo.experienceId);
    assert.ok(demo.bookingId);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});

import { randomUUID, randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export async function runDemo({ baseUrl = 'http://localhost:3000', checkout = false, log = console.log } = {}) {
  const base = baseUrl.replace(/\/$/, '');
  const suffix = randomUUID();
  const call = async (path, { method = 'GET', body, cookie } = {}) => {
    const response = await fetch(`${base}/api${path}`, {
      method, headers: { origin: new URL(base).origin, ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000)
    });
    const json = await response.json();
    if (!response.ok) throw new Error(`${method} ${path} : HTTP ${response.status}, ${json.error || 'erreur API'}`);
    return { data: json, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  await call('/health');
  log('API disponible. Création de données de démonstration locales...');
  const account = async role => (await call('/auth/register', {
    method: 'POST', body: { email: `${role}-${suffix}@example.com`, password: randomBytes(24).toString('hex') }
  })).cookie;
  const host = await account('host');
  const guest = await account('guest');
  await call('/profile', { method: 'PUT', cookie: host, body: {
    displayName: 'Hôte de démonstration', city: 'Grenoble', bio: 'Une table familiale pour découvrir la cuisine marocaine.',
    interests: ['Cuisine', 'Musique'], languages: ['Français'], dietaryPreferences: ['vegan']
  } });
  await call('/profile', { method: 'PUT', cookie: guest, body: {
    displayName: 'Invité de démonstration', city: 'Grenoble', languages: ['Français'], dietaryPreferences: ['vegan']
  } });
  const experience = (await call('/experiences', { method: 'POST', cookie: host, body: {
    title: `Table de démonstration ${suffix.slice(0, 8)}`, city: 'Grenoble', cuisine: 'Marocaine',
    theme: 'Découverte', atmosphere: 'Calme', dietaryOptions: ['vegan'], menuPriceCents: 2800
  } })).data;
  await call(`/experiences/${experience.id}/menu`, { method: 'POST', cookie: host, body: {
    title: 'Tajine de légumes', description: 'Repas de démonstration.', position: 0
  } });
  const date = (await call(`/experiences/${experience.id}/dates`, { method: 'POST', cookie: host, body: {
    startsAt: new Date(Date.now() + 7 * 86400000).toISOString(), capacity: 4
  } })).data;
  await call(`/experiences/${experience.id}/publish`, { method: 'POST', cookie: host });
  const results = (await call('/experiences?city=Grenoble&diet=vegan&guests=2')).data;
  log(`Recherche filtrée : ${results.experiences.length} résultat(s) sur cette page.`);
  const booking = (await call('/bookings', { method: 'POST', cookie: guest, body: { dateId: date.id, guests: 2 } })).data;
  if (booking.quote.totalCents !== 6400) throw new Error('Total de démonstration incorrect');
  await call(`/bookings/${booking.id}/accept`, { method: 'POST', cookie: host });
  const detail = (await call(`/experiences/${experience.id}`)).data;
  if (detail.dates.find(item => item.id === date.id)?.placesRemaining !== 2) throw new Error('Nombre de places incorrect');
  log(`Réservation ${booking.id} acceptée : 64,00 EUR pour deux personnes, 2 places restantes.`);
  if (!checkout) {
    log('Parcours API terminé. Aucun paiement déclenché. Les données de démonstration restent dans la base.');
    return { experienceId: experience.id, bookingId: booking.id };
  }
  const payment = (await call(`/bookings/${booking.id}/checkout`, { method: 'POST', cookie: guest })).data;
  log(`Ouvre ce lien Stripe TEST pour payer : ${payment.url}`);
  log('Attente du webhook pendant 10 minutes. Après paiement, ce terminal doit afficher le statut paid.');
  const until = Date.now() + 10 * 60 * 1000;
  while (Date.now() < until) {
    await setTimeout(2500);
    const bookings = (await call('/bookings', { cookie: guest })).data.bookings;
    const status = bookings.find(item => item.id === booking.id)?.status;
    if (status === 'paid') { log('Paiement test confirmé par le webhook : paid. Aucun portefeuille crédité.'); return { bookingId: booking.id, status }; }
  }
  throw new Error('Délai dépassé : vérifier Stripe CLI, le webhook et le statut dans Stripe. Les données restent dans la base.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemo({ baseUrl: process.env.API_BASE_URL || 'http://localhost:3000', checkout: process.argv.includes('--checkout') })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

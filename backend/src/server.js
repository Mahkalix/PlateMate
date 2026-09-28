import express from 'express';
import pg from 'pg';
import { rateLimit } from 'express-rate-limit';
import Stripe from 'stripe';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { credentials, profile } from './validation.js';
import { auth0Middleware } from './auth0.js';
import { migrate } from './migrations.js';
import helmet from 'helmet';
import cors from 'cors';
import { socialRoutes } from './social.js';
import { walletRoutes } from './wallet.js';
import { mediaRoutes } from './media.js';
import { experienceRoutes, stripeWebhook } from './experiences.js';

const scrypt = promisify(scryptCallback);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.disable('x-powered-by');
if (process.env.STRIPE_SECRET_KEY && !/^sk_(test|live)_/.test(process.env.STRIPE_SECRET_KEY)) throw new Error('Clé Stripe invalide');
if (process.env.NODE_ENV === 'production' && process.env.AUTH_MODE !== 'auth0') throw new Error('AUTH_MODE=auth0 requis en production');
if (process.env.NODE_ENV === 'production' && (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.APP_ORIGIN?.startsWith('https://'))) throw new Error('Stripe et APP_ORIGIN HTTPS requis en production');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
if (stripe && process.env.STRIPE_WEBHOOK_SECRET) app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook(pool, stripe, process.env.STRIPE_WEBHOOK_SECRET));
app.use(helmet());
app.use(cors({ origin: process.env.APP_ORIGIN || false }));
app.use(express.json({ limit: '32kb' }));
const cookieName = 'platemate_session';
const sessionMs = 7 * 24 * 60 * 60 * 1000;
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = await scrypt(password, salt, 64);
  const expectedBytes = Buffer.from(expected, 'hex');
  return actual.length === expectedBytes.length && timingSafeEqual(actual, expectedBytes);
}
function readToken(req) {
  const value = req.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`));
  return value?.slice(cookieName.length + 1);
}
async function localRequireUser(req, res, next) {
  try {
    const token = readToken(req);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Authentification requise' });
    const { rows } = await pool.query('SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()', [tokenHash(token)]);
    if (!rows[0]) return res.status(401).json({ error: 'Session expirée' });
    req.user = rows[0];
    next();
  } catch (error) { next(error); }
}
async function createSession(userId, res) {
  const token = randomBytes(32).toString('hex');
  await pool.query('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash(token), userId, new Date(Date.now() + sessionMs)]);
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionMs });
}
function validate(schema, req, res) {
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Données invalides', details: result.error.flatten() }); return null; }
  return result.data;
}

const authMode = process.env.AUTH_MODE === 'auth0' ? 'auth0' : 'local';
const auth0 = authMode === 'auth0' ? auth0Middleware(pool, { issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, audience: process.env.AUTH0_AUDIENCE }) : null;
const requireUser = authMode === 'auth0' ? auth0 : localRequireUser;

// Cookie sessions require a same-origin write. Stripe webhooks use signatures.
app.use((req, res, next) => {
  if (authMode === 'auth0' || req.path === '/api/stripe/webhook' || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  const expectedOrigin = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if ((process.env.NODE_ENV === 'production' && !origin) || (origin && origin !== expectedOrigin)) return res.status(403).json({ error: 'Origine refusée' });
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/ready', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'ready' }); } catch { res.status(503).json({ status: 'unavailable' }); } });
const localOnly = (_req, res, next) => authMode === 'local' ? next() : res.status(404).json({ error: 'Authentification gérée par Auth0' });
app.post('/api/auth/register', localOnly, authLimit, async (req, res, next) => {
  try {
    const data = validate(credentials, req, res);
    if (!data) return;
    const { rows } = await pool.query('INSERT INTO users(id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id, email', [randomUUID(), data.email, await hashPassword(data.password)]);
    if (!rows[0]) return res.status(409).json({ error: 'Compte déjà existant' });
    await createSession(rows[0].id, res);
    res.status(201).json({ user: rows[0] });
  } catch (error) { next(error); }
});
app.post('/api/auth/login', localOnly, authLimit, async (req, res, next) => {
  try {
    const data = validate(credentials, req, res);
    if (!data) return;
    const { rows } = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [data.email]);
    if (!rows[0] || !(await verifyPassword(data.password, rows[0].password_hash))) return res.status(401).json({ error: 'Identifiants invalides' });
    await createSession(rows[0].id, res);
    res.json({ user: { id: rows[0].id, email: rows[0].email } });
  } catch (error) { next(error); }
});
app.get('/api/auth/me', requireUser, (req, res) => res.json({ user: req.user }));
app.post('/api/auth/logout', localOnly, requireUser, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(readToken(req))]);
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  } catch (error) { next(error); }
});
app.get('/api/profile', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT display_name AS "displayName", city, bio, photo_url AS "photoUrl", interests, languages, dietary_preferences AS "dietaryPreferences", allergies, preferred_cuisines AS "preferredCuisines", experience_goals AS "experienceGoals", preferred_atmospheres AS "preferredAtmospheres", meeting_context AS "meetingContext" FROM profiles WHERE user_id = $1', [req.user.id]);
    res.json({ profile: rows[0] ?? null });
  } catch (error) { next(error); }
});
app.put('/api/profile', requireUser, async (req, res, next) => {
  try {
    const data = validate(profile, req, res);
    if (!data) return;
    const { rows } = await pool.query(`INSERT INTO profiles(user_id, display_name, city, bio, languages, dietary_preferences, allergies, preferred_cuisines, experience_goals, preferred_atmospheres, meeting_context, photo_url, interests)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, bio = EXCLUDED.bio, languages = EXCLUDED.languages, dietary_preferences = EXCLUDED.dietary_preferences, allergies = EXCLUDED.allergies, preferred_cuisines = EXCLUDED.preferred_cuisines, experience_goals = EXCLUDED.experience_goals, preferred_atmospheres = EXCLUDED.preferred_atmospheres, meeting_context = EXCLUDED.meeting_context, photo_url = EXCLUDED.photo_url, interests = EXCLUDED.interests, updated_at = now()
      RETURNING user_id`, [req.user.id, data.displayName, data.city, data.bio, data.languages, data.dietaryPreferences, data.allergies, data.preferredCuisines, data.experienceGoals, data.preferredAtmospheres, data.meetingContext, data.photoUrl, data.interests]);
    res.json({ saved: Boolean(rows[0]) });
  } catch (error) { next(error); }
});
app.use('/api', experienceRoutes(pool, requireUser, stripe));
app.use('/api', socialRoutes(pool, requireUser));
app.use('/api', walletRoutes(pool, requireUser, stripe));
app.use('/api', mediaRoutes(requireUser));
app.use((error, _req, res, _next) => {
  if (error.status === 401 || error.statusCode === 401) return res.status(401).json({ error: 'Authentification requise' });
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error:'Image trop volumineuse' });
  if (error.status && error.status < 500) return res.status(error.status).json({ error:error.message });
  if (error.code === '23505') return res.status(409).json({ error: 'Ce contenu existe déjà' });
  console.error(error);
  res.status(500).json({ error: 'Erreur interne' });
});

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL est requis');
  if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN est requis en production');
  if (process.argv.includes('--migrate')) {
    try { await migrate(pool); } finally { await pool.end(); }
  } else {
    const server = app.listen(Number(process.env.PORT || 3000), () => console.log(`PlateMate API :${process.env.PORT || 3000}`));
    process.on('SIGTERM', () => server.close(() => pool.end()));
    process.on('SIGINT', () => server.close(() => pool.end()));
  }
}
export { app };

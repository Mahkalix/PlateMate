import express from 'express';
import pg from 'pg';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { credentials, profile } from './validation.js';
import { compatibility } from './matching.js';

const scrypt = promisify(scryptCallback);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
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
async function requireUser(req, res, next) {
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

// The site and API share an origin. Cross-origin writes cannot use the session cookie.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  const expectedOrigin = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if ((process.env.NODE_ENV === 'production' && !origin) || (origin && origin !== expectedOrigin)) return res.status(403).json({ error: 'Origine refusée' });
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/register', authLimit, async (req, res, next) => {
  try {
    const data = validate(credentials, req, res);
    if (!data) return;
    const { rows } = await pool.query('INSERT INTO users(id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING RETURNING id, email', [randomUUID(), data.email, await hashPassword(data.password)]);
    if (!rows[0]) return res.status(409).json({ error: 'Compte déjà existant' });
    await createSession(rows[0].id, res);
    res.status(201).json({ user: rows[0] });
  } catch (error) { next(error); }
});
app.post('/api/auth/login', authLimit, async (req, res, next) => {
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
app.post('/api/auth/logout', requireUser, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(readToken(req))]);
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  } catch (error) { next(error); }
});
app.get('/api/profile', requireUser, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT display_name AS "displayName", city, bio, languages, dietary_preferences AS "dietaryPreferences", allergies, meeting_context AS "meetingContext", discoverable FROM profiles WHERE user_id = $1', [req.user.id]);
    res.json({ profile: rows[0] ?? null });
  } catch (error) { next(error); }
});
app.put('/api/profile', requireUser, async (req, res, next) => {
  try {
    const data = validate(profile, req, res);
    if (!data) return;
    const { rows } = await pool.query(`INSERT INTO profiles(user_id, display_name, city, bio, languages, dietary_preferences, allergies, meeting_context, discoverable)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, city = EXCLUDED.city, bio = EXCLUDED.bio, languages = EXCLUDED.languages, dietary_preferences = EXCLUDED.dietary_preferences, allergies = EXCLUDED.allergies, meeting_context = EXCLUDED.meeting_context, discoverable = EXCLUDED.discoverable, updated_at = now()
      RETURNING user_id`, [req.user.id, data.displayName, data.city, data.bio, data.languages, data.dietaryPreferences, data.allergies, data.meetingContext, data.discoverable]);
    res.json({ saved: Boolean(rows[0]) });
  } catch (error) { next(error); }
});
app.get('/api/discover', requireUser, async (req, res, next) => {
  try {
    const { rows: own } = await pool.query('SELECT city, languages, dietary_preferences AS "dietaryPreferences" FROM profiles WHERE user_id = $1', [req.user.id]);
    if (!own[0]) return res.status(409).json({ error: 'Complète ton profil avant de découvrir les autres' });
    const { rows } = await pool.query(`SELECT user_id AS id, display_name AS "displayName", city, bio, languages, dietary_preferences AS "dietaryPreferences", meeting_context AS "meetingContext"
      FROM profiles WHERE discoverable = true AND user_id <> $1 ORDER BY updated_at DESC LIMIT 100`, [req.user.id]);
    const profiles = rows.map(candidate => ({ ...candidate, ...compatibility(own[0], candidate) })).sort((a, b) => b.score - a.score);
    res.json({ profiles });
  } catch (error) { next(error); }
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Erreur interne' });
});

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL est requis');
  if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN est requis en production');
  if (process.argv.includes('--migrate')) {
    for (const migration of ['001_initial.sql', '002_discoverable.sql']) {
      const sql = await readFile(new URL(`../sql/${migration}`, import.meta.url), 'utf8');
      await pool.query(sql);
    }
    await pool.end();
  } else {
    app.listen(Number(process.env.PORT || 3000), () => console.log(`PlateMate API :${process.env.PORT || 3000}`));
  }
}
export { app };

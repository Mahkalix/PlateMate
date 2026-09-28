import { auth } from 'express-oauth2-jwt-bearer';
import { randomUUID } from 'node:crypto';

export function auth0Middleware(pool, { issuerBaseURL, audience }) {
  if (!issuerBaseURL || !audience) throw new Error('AUTH0_ISSUER_BASE_URL et AUTH0_AUDIENCE sont requis');
  const verify = auth({ issuerBaseURL, audience, tokenSigningAlg: 'RS256' });
  return [verify, async (req, res, next) => {
    try {
      const subject = req.auth?.payload.sub;
      if (!subject || subject.endsWith('@clients') || subject.length > 255) return res.status(403).json({ error: 'Compte utilisateur requis' });
      const email = req.auth.payload['https://weareplatemate.com/email'];
      const verified = req.auth.payload['https://weareplatemate.com/email_verified'] === true;
      const safeEmail = verified && typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.toLowerCase() : null;
      const { rows } = await pool.query(`INSERT INTO users(id, auth_subject) VALUES($1,$2)
        ON CONFLICT (auth_subject) DO UPDATE SET auth_subject=EXCLUDED.auth_subject
        RETURNING id,auth_subject,disabled_at,email`, [randomUUID(), subject]);
      if (rows[0].disabled_at) return res.status(403).json({ error: 'Compte désactivé' });
      // Email is used only as contact information. Never merge identities by address.
      req.user = { id: rows[0].id, email: safeEmail, authSubject: subject };
      next();
    } catch (error) { next(error); }
  }];
}

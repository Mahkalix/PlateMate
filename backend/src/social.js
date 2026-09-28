import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
const uuid = z.uuid();
const message = z.object({ body: z.string().trim().min(1).max(2000) }).strict();
const review = z.object({ rating: z.number().int().min(1).max(5), body: z.string().trim().max(2000).default('') }).strict();

export function socialRoutes(pool, requireUser) {
  const router = express.Router();
  router.get('/bookings/:id/messages', requireUser, async (req, res, next) => {
    if (!uuid.safeParse(req.params.id).success) return res.status(400).json({ error: 'Identifiant invalide' });
    try {
      const booking = await pool.query('SELECT b.id FROM bookings b JOIN experience_dates d ON d.id=b.date_id JOIN experiences e ON e.id=d.experience_id WHERE b.id=$1 AND (b.guest_id=$2 OR e.host_id=$2)', [req.params.id,req.user.id]);
      if (!booking.rowCount) return res.status(404).json({ error: 'Réservation introuvable' });
      const { rows } = await pool.query('SELECT id,sender_id AS "senderId",body,created_at AS "createdAt" FROM messages WHERE booking_id=$1 ORDER BY created_at,id LIMIT 200', [req.params.id]);
      res.json({ messages: rows });
    } catch (error) { next(error); }
  });
  router.post('/bookings/:id/messages', requireUser, async (req, res, next) => {
    const data = message.safeParse(req.body);
    if (!uuid.safeParse(req.params.id).success || !data.success) return res.status(400).json({ error: 'Message invalide' });
    try {
      const { rows } = await pool.query(`INSERT INTO messages(id,booking_id,sender_id,body)
        SELECT $1,b.id,$2,$3 FROM bookings b JOIN experience_dates d ON d.id=b.date_id JOIN experiences e ON e.id=d.experience_id
        WHERE b.id=$4 AND (b.guest_id=$2 OR e.host_id=$2) AND b.status NOT IN ('declined','cancelled','refunded') RETURNING id`, [randomUUID(),req.user.id,data.data.body,req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Conversation indisponible' });
      res.status(201).json({ id: rows[0].id });
    } catch (error) { next(error); }
  });
  router.get('/hosts/:id/reviews', async (req, res, next) => {
    if (!uuid.safeParse(req.params.id).success) return res.status(400).json({ error: 'Identifiant invalide' });
    try {
      const { rows } = await pool.query(`SELECT r.id,r.rating,r.body,r.created_at AS "createdAt",p.display_name AS "authorName"
        FROM reviews r JOIN profiles p ON p.user_id=r.author_id WHERE r.host_id=$1 ORDER BY r.created_at DESC LIMIT 100`, [req.params.id]);
      res.json({ reviews: rows });
    } catch (error) { next(error); }
  });
  router.post('/bookings/:id/review', requireUser, async (req, res, next) => {
    const data = review.safeParse(req.body);
    if (!uuid.safeParse(req.params.id).success || !data.success) return res.status(400).json({ error: 'Avis invalide' });
    try {
      const { rows } = await pool.query(`INSERT INTO reviews(id,booking_id,author_id,host_id,rating,body)
        SELECT $1,b.id,$2,e.host_id,$3,$4 FROM bookings b JOIN experience_dates d ON d.id=b.date_id
        JOIN experiences e ON e.id=d.experience_id WHERE b.id=$5 AND b.guest_id=$2 AND b.status IN ('paid','completed') AND d.starts_at < now()
        RETURNING id`, [randomUUID(),req.user.id,data.data.rating,data.data.body,req.params.id]);
      if (!rows[0]) return res.status(409).json({ error: 'Avis indisponible' });
      res.status(201).json({ id:rows[0].id });
    } catch (error) { next(error); }
  });
  return router;
}

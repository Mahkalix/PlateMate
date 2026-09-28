import express from 'express';
import { randomUUID } from 'node:crypto';
import { experienceInput, dateInput, menuItemInput, bookingInput, quote, uuidParam } from './booking-validation.js';
import { experienceFilters, buildExperienceSearch } from './experience-search.js';
import { handlePayoutEvent } from './wallet.js';

function parse(schema, value, res) {
  const result = schema.safeParse(value);
  if (!result.success) { res.status(400).json({ error: 'Données invalides' }); return null; }
  return result.data;
}

export function experienceRoutes(pool, requireUser, stripe) {
  const router = express.Router();
  router.get('/my/experiences', requireUser, async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id,title,city,cuisine,theme,published,created_at AS "createdAt" FROM experiences WHERE host_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user.id]);
      res.json({ experiences: rows });
    } catch (error) { next(error); }
  });
  router.get(['/experiences', '/discover'], async (req, res, next) => {
    try {
      const filters = parse(experienceFilters, req.query, res);
      if (!filters) return;
      const { rows } = await pool.query(buildExperienceSearch(filters));
      res.json({ experiences: rows.slice(0, filters.limit), filters,
        pagination: { limit: filters.limit, offset: filters.offset, hasMore: rows.length > filters.limit } });
    } catch (error) { next(error); }
  });
  router.get('/experiences/:id', async (req, res, next) => {
    try {
      const id = parse(uuidParam, req.params.id, res);
      if (!id) return;
      const { rows } = await pool.query(`SELECT e.id, e.title, e.description, e.city, e.cuisine, e.theme, e.atmosphere, e.photo_url AS "photoUrl", e.dietary_options AS "dietaryOptions", e.menu_price_cents AS "menuPriceCents", e.service_fee_cents AS "serviceFeeCents", e.host_id AS "hostId", p.display_name AS "hostName", p.photo_url AS "hostPhotoUrl", p.bio AS "hostBio", p.languages AS "hostLanguages", p.interests AS "hostInterests"
        FROM experiences e JOIN profiles p ON p.user_id = e.host_id WHERE e.id = $1 AND e.published`, [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Expérience introuvable' });
      const dates = await pool.query(`SELECT d.id, d.starts_at AS "startsAt", d.capacity - COALESCE(SUM(b.guests) FILTER (WHERE b.status IN ('accepted','checkout_pending','paid','completed','refund_pending','disputed')), 0)::integer AS "placesRemaining"
        FROM experience_dates d LEFT JOIN bookings b ON b.date_id = d.id
        WHERE d.experience_id = $1 AND d.starts_at > now() GROUP BY d.id ORDER BY d.starts_at`, [id]);
      const menu = await pool.query('SELECT id, title, description, position FROM menu_items WHERE experience_id = $1 ORDER BY position', [id]);
      res.json({ experience: rows[0], dates: dates.rows, menu: menu.rows });
    } catch (error) { next(error); }
  });
  router.post('/experiences', requireUser, async (req, res, next) => {
    try {
      const data = parse(experienceInput, req.body, res);
      if (!data) return;
      const { rows: profiles } = await pool.query('SELECT 1 FROM profiles WHERE user_id = $1', [req.user.id]);
      if (!profiles[0]) return res.status(409).json({ error: 'Crée un profil avant de devenir hôte' });
      const id = randomUUID();
      await pool.query(`INSERT INTO experiences(id, host_id, title, description, city, cuisine, atmosphere, dietary_options, menu_price_cents, service_fee_cents, theme, photo_url, published)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)`, [id, req.user.id, data.title, data.description, data.city, data.cuisine, data.atmosphere, data.dietaryOptions, data.menuPriceCents, 400, data.theme, data.photoUrl]);
      res.status(201).json({ id });
    } catch (error) { next(error); }
  });
  router.put('/experiences/:id', requireUser, async (req, res, next) => {
    const id = parse(uuidParam, req.params.id, res);
    const data = parse(experienceInput, req.body, res);
    if (!id || !data) return;
    try {
      const { rows } = await pool.query(`UPDATE experiences e SET title=$3,description=$4,city=$5,cuisine=$6,theme=$7,atmosphere=$8,photo_url=$9,dietary_options=$10,menu_price_cents=$11
        WHERE e.id=$1 AND e.host_id=$2 AND NOT EXISTS(SELECT 1 FROM bookings b JOIN experience_dates d ON d.id=b.date_id WHERE d.experience_id=e.id AND b.status IN ('accepted','checkout_pending','paid','completed','refund_pending','disputed')) RETURNING e.id`,
      [id,req.user.id,data.title,data.description,data.city,data.cuisine,data.theme,data.atmosphere,data.photoUrl,data.dietaryOptions,data.menuPriceCents]);
      if (!rows[0]) return res.status(409).json({ error:'Modification indisponible après réservation confirmée' });
      res.json({ id });
    } catch (error) { next(error); }
  });
  router.post('/experiences/:id/publish', requireUser, async (req, res, next) => {
    const id = parse(uuidParam,req.params.id,res);
    if (!id) return;
    try {
      const { rows } = await pool.query(`UPDATE experiences e SET published=true WHERE e.id=$1 AND e.host_id=$2
        AND EXISTS(SELECT 1 FROM experience_dates d WHERE d.experience_id=e.id AND d.starts_at>now())
        AND EXISTS(SELECT 1 FROM menu_items m WHERE m.experience_id=e.id) RETURNING e.id`, [id,req.user.id]);
      if (!rows[0]) return res.status(409).json({ error:'Ajoute un menu et une date future' });
      res.json({ id,published:true });
    } catch (error) { next(error); }
  });
  router.post('/experiences/:id/unpublish', requireUser, async (req, res, next) => {
    const id = parse(uuidParam,req.params.id,res);
    if (!id) return;
    try {
      const { rows } = await pool.query('UPDATE experiences SET published=false WHERE id=$1 AND host_id=$2 RETURNING id',[id,req.user.id]);
      if (!rows[0]) return res.status(404).json({ error:'Expérience introuvable' });
      res.json({ id,published:false });
    } catch (error) { next(error); }
  });
  router.post('/experiences/:id/dates', requireUser, async (req, res, next) => {
    try {
      const id = parse(uuidParam, req.params.id, res);
      const data = parse(dateInput, req.body, res);
      if (!id || !data) return;
      if (Date.parse(data.startsAt) <= Date.now()) return res.status(400).json({ error: 'La date doit être future' });
      const dateId = randomUUID();
      const { rows } = await pool.query(`INSERT INTO experience_dates(id, experience_id, starts_at, capacity)
        SELECT $1, e.id, $2, $3 FROM experiences e WHERE e.id = $4 AND e.host_id = $5 RETURNING id`, [dateId, data.startsAt, data.capacity, id, req.user.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Expérience introuvable' });
      res.status(201).json({ id: dateId });
    } catch (error) { next(error); }
  });
  router.post('/experiences/:id/menu', requireUser, async (req, res, next) => {
    try {
      const id = parse(uuidParam, req.params.id, res);
      const data = parse(menuItemInput, req.body, res);
      if (!id || !data) return;
      const itemId = randomUUID();
      const { rows } = await pool.query(`INSERT INTO menu_items(id, experience_id, title, description, position)
        SELECT $1, e.id, $2, $3, $4 FROM experiences e WHERE e.id = $5 AND e.host_id = $6 RETURNING id`, [itemId, data.title, data.description, data.position, id, req.user.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Expérience introuvable' });
      res.status(201).json({ id: itemId });
    } catch (error) { next(error); }
  });
  router.post('/bookings', requireUser, async (req, res, next) => {
    try {
      const data = parse(bookingInput, req.body, res);
      if (!data) return;
      const { rows } = await pool.query(`SELECT d.id, e.host_id, e.menu_price_cents, e.service_fee_cents FROM experience_dates d
        JOIN experiences e ON e.id = d.experience_id WHERE d.id = $1 AND d.starts_at > now() AND e.published`, [data.dateId]);
      if (!rows[0]) return res.status(404).json({ error: 'Date indisponible' });
      if (rows[0].host_id === req.user.id) return res.status(403).json({ error: 'Un hôte ne peut pas réserver sa table' });
      const price = quote(rows[0].menu_price_cents, rows[0].service_fee_cents, data.guests);
      const key = req.get('idempotency-key');
      if (key && !/^[A-Za-z0-9_-]{8,128}$/.test(key)) return res.status(400).json({ error:'Clé de répétition invalide' });
      const id = randomUUID();
      const inserted = await pool.query(`INSERT INTO bookings(id, date_id, guest_id, guests, menu_price_cents, service_fee_cents, total_cents,idempotency_key)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id`, [id, data.dateId, req.user.id, data.guests, rows[0].menu_price_cents, rows[0].service_fee_cents, price.totalCents,key || null]);
      if (!inserted.rowCount) {
        const previous = await pool.query('SELECT id,date_id,guests,status,total_cents AS "totalCents" FROM bookings WHERE guest_id=$1 AND idempotency_key=$2',[req.user.id,key]);
        if (previous.rows[0]?.date_id !== data.dateId || previous.rows[0]?.guests !== data.guests) return res.status(409).json({error:'Clé déjà utilisée pour une autre demande'});
        return res.json({id:previous.rows[0].id,status:previous.rows[0].status,quote:{totalCents:previous.rows[0].totalCents}});
      }
      res.status(201).json({ id, status: 'requested', quote: price });
    } catch (error) { next(error); }
  });
  router.get('/bookings', requireUser, async (req, res, next) => {
    try {
      const { rows } = await pool.query(`SELECT b.id, b.guests, b.total_cents AS "totalCents", b.status, d.starts_at AS "startsAt", e.title, e.id AS "experienceId"
        FROM bookings b JOIN experience_dates d ON d.id = b.date_id JOIN experiences e ON e.id = d.experience_id
        WHERE b.guest_id = $1 OR e.host_id = $1 ORDER BY b.created_at DESC LIMIT 100`, [req.user.id]);
      res.json({ bookings: rows });
    } catch (error) { next(error); }
  });
  router.post('/bookings/:id/accept', requireUser, async (req, res, next) => {
    const id = parse(uuidParam, req.params.id, res);
    if (!id) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT b.id, b.date_id, b.guests, b.status, d.capacity, d.starts_at
        FROM bookings b JOIN experience_dates d ON d.id = b.date_id JOIN experiences e ON e.id = d.experience_id
        WHERE b.id = $1 AND e.host_id = $2 FOR UPDATE OF d, b`, [id, req.user.id]);
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Demande introuvable' }); }
      const booking = rows[0];
      if (booking.status !== 'requested' || new Date(booking.starts_at) <= new Date()) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Demande non confirmable' }); }
      const used = await client.query(`SELECT COALESCE(SUM(guests), 0)::integer AS seats FROM bookings WHERE date_id = $1 AND status IN ('accepted','checkout_pending','paid','completed','refund_pending','disputed')`, [booking.date_id]);
      if (used.rows[0].seats + booking.guests > booking.capacity) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Plus assez de places' }); }
      await client.query("UPDATE bookings SET status = 'accepted', accepted_at=now() WHERE id = $1", [id]);
      await client.query('COMMIT');
      res.json({ id, status: 'accepted' });
    } catch (error) { await client.query('ROLLBACK'); next(error); }
    finally { client.release(); }
  });
  router.post('/bookings/:id/decline', requireUser, async (req, res, next) => {
    try {
      const id = parse(uuidParam, req.params.id, res);
      if (!id) return;
      const { rows } = await pool.query(`UPDATE bookings b SET status = 'declined' FROM experience_dates d, experiences e
        WHERE b.id = $1 AND b.date_id = d.id AND d.experience_id = e.id AND e.host_id = $2 AND b.status = 'requested' RETURNING b.id`, [id, req.user.id]);
      if (!rows[0]) return res.status(409).json({ error: 'Demande non refusée' });
      res.json({ id, status: 'declined' });
    } catch (error) { next(error); }
  });
  router.post('/bookings/:id/checkout', requireUser, async (req, res, next) => {
    const id = parse(uuidParam, req.params.id, res);
    if (!id) return;
    if (!stripe) return res.status(503).json({ error: 'Stripe test non configuré' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT b.*, e.title, d.starts_at FROM bookings b JOIN experience_dates d ON d.id = b.date_id JOIN experiences e ON e.id = d.experience_id WHERE b.id = $1 AND b.guest_id = $2 FOR UPDATE OF b`, [id, req.user.id]);
      const booking = rows[0];
      if (booking?.status === 'checkout_pending' && booking.stripe_session_id) {
        const existing = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
        await client.query('COMMIT');
        return res.json({ url:existing.url, status:existing.status });
      }
      if (!booking || booking.status !== 'accepted' || new Date(booking.starts_at) <= new Date(Date.now()+35*60*1000)) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Réservation non payable' }); }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment', payment_method_types: ['card'], client_reference_id: id,
        ...(req.user.email ? { customer_email:req.user.email } : {}),
        line_items: [{ price_data: { currency: 'eur', unit_amount: booking.menu_price_cents, product_data: { name: booking.title } }, quantity: booking.guests },
          { price_data: { currency: 'eur', unit_amount: booking.service_fee_cents, product_data: { name: 'Frais de service PlateMate' } }, quantity: booking.guests }].filter(item => item.price_data.unit_amount > 0),
        success_url: `${process.env.APP_ORIGIN}/reservations/${id}?checkout=success`,
        cancel_url: `${process.env.APP_ORIGIN}/reservations/${id}?checkout=cancel`,
        metadata: { bookingId: id },
        payment_intent_data: { metadata: { bookingId:id } },
        expires_at: Math.floor(Date.now()/1000)+30*60
      }, { idempotencyKey: `checkout-${id}-${booking.checkout_attempt + 1}` });
      await client.query("UPDATE bookings SET status = 'checkout_pending', stripe_session_id = $2, checkout_attempt = checkout_attempt + 1 WHERE id = $1", [id, session.id]);
      await client.query('COMMIT');
      res.json({ url: session.url });
    } catch (error) { await client.query('ROLLBACK'); next(error); }
    finally { client.release(); }
  });
  router.post('/bookings/:id/cancel', requireUser, async (req,res,next) => {
    const id = parse(uuidParam, req.params.id, res);
    if (!id) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT b.*,d.starts_at,e.host_id FROM bookings b JOIN experience_dates d ON d.id=b.date_id
        JOIN experiences e ON e.id=d.experience_id WHERE b.id=$1 AND (b.guest_id=$2 OR e.host_id=$2) FOR UPDATE OF b`, [id,req.user.id]);
      const booking = rows[0];
      if (!booking || !['requested','accepted','paid'].includes(booking.status)) { await client.query('ROLLBACK'); return res.status(409).json({ error:'Annulation indisponible' }); }
      if (booking.status==='paid') {
        if (req.user.id===booking.guest_id && Date.parse(booking.starts_at)-Date.now()<24*60*60*1000) {
          await client.query('ROLLBACK'); return res.status(409).json({ error:'Délai de remboursement dépassé (24 h)' });
        }
        if (Date.parse(booking.starts_at) <= Date.now()) { await client.query('ROLLBACK'); return res.status(409).json({ error:'Expérience déjà commencée' }); }
        if (!stripe) { await client.query('ROLLBACK'); return res.status(503).json({ error:'Stripe indisponible' }); }
        await client.query("UPDATE bookings SET status='refund_pending',refund_reason='cancelled',cancelled_at=now() WHERE id=$1", [id]);
        await client.query('COMMIT');
        await stripe.refunds.create({ payment_intent:booking.stripe_payment_intent_id, reason:'requested_by_customer', metadata:{bookingId:id} }, { idempotencyKey:`cancel-refund-${id}` });
        return res.status(202).json({ id,status:'refund_pending' });
      }
      await client.query("UPDATE bookings SET status='cancelled',cancelled_at=now() WHERE id=$1", [id]);
      await client.query('COMMIT');
      res.json({ id,status:'cancelled' });
    } catch (error) { await client.query('ROLLBACK').catch(()=>{}); next(error); }
    finally { client.release(); }
  });
  return router;
}

export function stripeWebhook(pool, stripe, secret) {
  return async (req, res) => {
    let event;
    try { event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), secret); }
    catch { return res.status(400).json({ error: 'Signature Stripe invalide' }); }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const record = await client.query(`INSERT INTO stripe_events(id,type) VALUES($1,$2)
        ON CONFLICT(id) DO UPDATE SET type=EXCLUDED.type RETURNING processed_at`, [event.id,event.type]);
      if (record.rows[0].processed_at) { await client.query('COMMIT'); return res.json({ received:true }); }
      if (['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) {
        const session=event.data.object;
        if (session.payment_status==='paid' && session.currency==='eur' && session.payment_intent) {
          const intent=await stripe.paymentIntents.retrieve(session.payment_intent);
          const charge=typeof intent.latest_charge==='string' ? intent.latest_charge : intent.latest_charge?.id;
          if (intent.status!=='succeeded' || !charge || intent.amount_received!==session.amount_total) throw new Error('Paiement Stripe non confirmé');
          const result=await client.query(`UPDATE bookings SET status='paid',stripe_payment_intent_id=$3,stripe_charge_id=$5
            WHERE id=$1 AND stripe_session_id=$2 AND status='checkout_pending' AND total_cents=$4 RETURNING id,date_id,guests,menu_price_cents`,
            [session.client_reference_id,session.id,intent.id,session.amount_total,charge]);
          if (result.rowCount) await client.query(`INSERT INTO wallet_entries(booking_id,host_id,amount_cents,state,available_at)
            SELECT b.id,e.host_id,b.guests*b.menu_price_cents,'pending',d.starts_at+interval '48 hours'
            FROM bookings b JOIN experience_dates d ON d.id=b.date_id JOIN experiences e ON e.id=d.experience_id WHERE b.id=$1
            ON CONFLICT(booking_id) DO NOTHING`, [result.rows[0].id]);
        }
      }
      if (['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)) {
        const session=event.data.object;
        await client.query("UPDATE bookings SET status='accepted',stripe_session_id=NULL WHERE id=$1 AND stripe_session_id=$2 AND status='checkout_pending'", [session.client_reference_id,session.id]);
      }
      if (['refund.created','refund.updated'].includes(event.type)) {
        const refund=event.data.object;
        const bookingId=refund.metadata?.bookingId;
        if (bookingId && refund.status==='succeeded') {
          const updated=await client.query(`UPDATE bookings SET status='refunded',stripe_refund_id=$2 WHERE id=$1 AND status='refund_pending' AND total_cents=$3 RETURNING id`, [bookingId,refund.id,refund.amount]);
          if (updated.rowCount) await client.query("UPDATE wallet_entries SET state='reversed',updated_at=now() WHERE booking_id=$1 AND state IN ('pending','available')", [bookingId]);
        }
      }
      if (['payout.paid','payout.failed'].includes(event.type)) await handlePayoutEvent(client,event);
      await client.query('UPDATE stripe_events SET processed_at=now() WHERE id=$1', [event.id]);
      await client.query('COMMIT');
      res.json({ received:true });
    } catch (error) { await client.query('ROLLBACK').catch(()=>{}); console.error(error); res.status(500).json({ error:'Erreur webhook' }); }
    finally { client.release(); }
  };
}

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_subject text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE users ADD CONSTRAINT users_identity_check CHECK (auth_subject IS NOT NULL OR (email IS NOT NULL AND password_hash IS NOT NULL));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('requested','accepted','checkout_pending','paid','declined','cancelled','refund_pending','refunded','completed','disputed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_charge_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_refund_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_id text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_state text NOT NULL DEFAULT 'none' CHECK (transfer_state IN ('none','processing','transferred','reversed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_started_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_payment_intent_idx ON bookings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE TABLE IF NOT EXISTS host_connect_accounts (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wallet_entries (
  booking_id uuid PRIMARY KEY REFERENCES bookings(id),
  host_id uuid NOT NULL REFERENCES users(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  state text NOT NULL CHECK (state IN ('pending','available','transfer_pending','transferred','reversed','disputed')),
  available_at timestamptz NOT NULL,
  stripe_transfer_id text UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wallet_entries_host_state_idx ON wallet_entries(host_id,state);
CREATE TABLE IF NOT EXISTS wallet_payouts (
  id uuid PRIMARY KEY,
  host_id uuid NOT NULL REFERENCES users(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  stripe_payout_id text UNIQUE,
  attempt integer NOT NULL DEFAULT 1,
  state text NOT NULL CHECK (state IN ('processing','paid','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_payouts_host_processing_idx ON wallet_payouts(host_id) WHERE state='processing';
CREATE TABLE IF NOT EXISTS wallet_payout_entries (
  payout_id uuid NOT NULL REFERENCES wallet_payouts(id),
  booking_id uuid NOT NULL REFERENCES wallet_entries(booking_id),
  PRIMARY KEY(payout_id,booking_id),
  UNIQUE(booking_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  sender_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_booking_idx ON messages(booking_id,created_at);
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
  author_id uuid NOT NULL REFERENCES users(id),
  host_id uuid NOT NULL REFERENCES users(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_host_idx ON reviews(host_id,created_at DESC);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS bookings_guest_idempotency_idx ON bookings(guest_id,idempotency_key) WHERE idempotency_key IS NOT NULL;

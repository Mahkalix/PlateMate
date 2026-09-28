CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY,
  host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  city text NOT NULL,
  cuisine text NOT NULL,
  atmosphere text NOT NULL DEFAULT '',
  dietary_options text[] NOT NULL DEFAULT '{}',
  menu_price_cents integer NOT NULL CHECK (menu_price_cents >= 100),
  service_fee_cents integer NOT NULL DEFAULT 400 CHECK (service_fee_cents >= 0),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experience_dates (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 30),
  UNIQUE (experience_id, starts_at)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL CHECK (position BETWEEN 0 AND 30),
  UNIQUE (experience_id, position)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY,
  date_id uuid NOT NULL REFERENCES experience_dates(id),
  guest_id uuid NOT NULL REFERENCES users(id),
  guests integer NOT NULL CHECK (guests BETWEEN 1 AND 10),
  menu_price_cents integer NOT NULL,
  service_fee_cents integer NOT NULL,
  total_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','checkout_pending','paid','declined')),
  stripe_session_id text UNIQUE,
  checkout_attempt integer NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_date_status_idx ON bookings (date_id, status);
CREATE INDEX IF NOT EXISTS bookings_guest_idx ON bookings (guest_id);

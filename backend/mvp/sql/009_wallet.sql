ALTER TABLE contexts ADD COLUMN contribution_cents integer NOT NULL DEFAULT 0 CHECK (contribution_cents BETWEEN 0 AND 100000);
ALTER TABLE bookings ADD COLUMN amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0);
ALTER TABLE bookings DROP CONSTRAINT bookings_payment_intent_status_check;
ALTER TABLE bookings ADD CHECK(payment_intent_status IN ('none','simulated','paid','refunded'));
CREATE TABLE wallet_topups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 request_id uuid NOT NULL, cents integer NOT NULL CHECK(cents BETWEEN 50 AND 100000), UNIQUE(user_id, request_id)
);
CREATE TABLE wallet_entries (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('credit','payment','refund')), cents integer NOT NULL,
 reference text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind,reference),
 CHECK ((kind='payment' AND cents<0) OR (kind<>'payment' AND cents>0))
);
CREATE INDEX wallet_history ON wallet_entries(user_id,id);
CREATE TABLE connect_accounts (host_id uuid PRIMARY KEY REFERENCES host_profiles(user_id) ON DELETE CASCADE, account text UNIQUE NOT NULL);
CREATE TABLE settlements (
 booking_id uuid PRIMARY KEY REFERENCES bookings ON DELETE RESTRICT, host_id uuid NOT NULL REFERENCES users,
 cents integer NOT NULL CHECK(cents>0), transfer_id text UNIQUE, payout_id text UNIQUE,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','transferred','processing','paid','failed')),
 attempted_at timestamptz
);
ALTER TABLE wallet_topups ADD COLUMN intent_id text UNIQUE, ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE settlements ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();

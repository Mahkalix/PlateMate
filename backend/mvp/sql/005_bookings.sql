CREATE TYPE booking_status AS ENUM ('pending','accepted','declined','cancelled','completed');
CREATE TABLE bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slot_id uuid NOT NULL REFERENCES context_slots(id) ON DELETE CASCADE,guest_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,party_size integer NOT NULL CHECK(party_size>0),status booking_status NOT NULL DEFAULT 'pending',payment_intent_status text NOT NULL DEFAULT 'none' CHECK(payment_intent_status IN ('none','simulated')));
CREATE UNIQUE INDEX bookings_active ON bookings(slot_id,guest_id) WHERE status IN ('pending','accepted','completed');
CREATE TABLE booking_status_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,status booking_status NOT NULL,actor_id uuid REFERENCES users(id) ON DELETE SET NULL,changed_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX events_booking ON booking_status_events(booking_id,id);

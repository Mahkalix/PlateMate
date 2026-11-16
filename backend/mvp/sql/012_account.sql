ALTER TABLE host_profiles ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE booking_allergy_consents (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
 allergies text[] NOT NULL,
 granted_at timestamptz NOT NULL DEFAULT now()
);

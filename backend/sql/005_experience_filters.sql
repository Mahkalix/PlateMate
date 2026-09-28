ALTER TABLE experiences ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT '';
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS experience_dates_starts_at_idx ON experience_dates (experience_id, starts_at);

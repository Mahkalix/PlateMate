ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discoverable boolean NOT NULL DEFAULT false;

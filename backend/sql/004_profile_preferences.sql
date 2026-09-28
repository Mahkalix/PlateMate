ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_cuisines text[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_goals text[] NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_atmospheres text[] NOT NULL DEFAULT '{}';

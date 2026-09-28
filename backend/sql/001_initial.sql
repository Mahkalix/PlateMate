CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  city text NOT NULL,
  bio text NOT NULL DEFAULT '',
  languages text[] NOT NULL DEFAULT '{}',
  dietary_preferences text[] NOT NULL DEFAULT '{}',
  allergies text[] NOT NULL DEFAULT '{}',
  meeting_context text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

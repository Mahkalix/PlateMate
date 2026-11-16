CREATE TABLE sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 refresh_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX sessions_user ON sessions(user_id);

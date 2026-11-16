CREATE TABLE profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 details jsonb NOT NULL,
 consented_at timestamptz,
 is_verified boolean NOT NULL DEFAULT false
);

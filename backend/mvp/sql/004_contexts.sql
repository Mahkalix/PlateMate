CREATE TABLE host_profiles(user_id uuid PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE);
CREATE TABLE contexts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),host_id uuid NOT NULL REFERENCES host_profiles(user_id) ON DELETE CASCADE,title text NOT NULL,kind text NOT NULL,ambience text NOT NULL,supported_diets text[] NOT NULL DEFAULT '{}',safe_for text[] NOT NULL DEFAULT '{}');
CREATE INDEX contexts_host ON contexts(host_id);
CREATE TABLE context_slots(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),context_id uuid NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,starts_at timestamptz NOT NULL,capacity integer NOT NULL CHECK(capacity>0),UNIQUE(context_id,starts_at));

ALTER TABLE reviews ADD COLUMN created_at timestamptz;
ALTER TABLE reviews ALTER COLUMN created_at SET DEFAULT now();

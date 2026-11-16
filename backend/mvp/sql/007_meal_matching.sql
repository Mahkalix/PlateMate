ALTER TABLE contexts
  ADD COLUMN languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN themes text[] NOT NULL DEFAULT '{}';

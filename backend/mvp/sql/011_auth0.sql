-- UUIDs, profiles, reservations and balances survive the change of identity provider.
ALTER TABLE users ADD COLUMN auth_issuer text, ADD COLUMN auth_subject text,
  ADD UNIQUE (auth_issuer, auth_subject),
  ADD CHECK ((auth_issuer IS NULL) = (auth_subject IS NULL)),
  DROP COLUMN password_hash;
DELETE FROM sessions;

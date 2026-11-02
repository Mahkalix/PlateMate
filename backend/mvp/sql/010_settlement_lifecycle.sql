-- Keep a completed guest's settlement payable independently of their account.
-- booking_id is a settlement business reference copied at completion.
ALTER TABLE settlements DROP CONSTRAINT settlements_booking_id_fkey;
ALTER TABLE settlements DROP CONSTRAINT settlements_host_id_fkey;
ALTER TABLE settlements ADD FOREIGN KEY(host_id) REFERENCES users(id) ON DELETE CASCADE;

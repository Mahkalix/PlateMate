CREATE TABLE messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),created_at timestamptz NOT NULL DEFAULT now(),CHECK(sender_id<>recipient_id));
CREATE INDEX messages_pair ON messages(sender_id,recipient_id,id);
CREATE TABLE reviews(booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,subject_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),comment text NOT NULL,PRIMARY KEY(booking_id,author_id));
CREATE INDEX reviews_subject ON reviews(subject_id);

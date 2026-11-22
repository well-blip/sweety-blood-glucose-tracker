-- Sweety database schema.
-- Run with `npm run db:setup`. It drops and recreates the tables, so ALL DATA IS DELETED.

DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,           -- stored lower-case, so the check is case-insensitive
  password_hash TEXT NOT NULL,                  -- bcrypt hash, never the plain password
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE readings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,                   -- a calendar day, no time or timezone
  slot         TEXT NOT NULL
               CHECK (slot IN ('MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER')),
  value        INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),  -- mg/dl
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One reading per slot per day for each user. Because there are only 4 slots,
  -- this also makes a 5th reading on the same day impossible.
  -- Postgres builds an index for this constraint, which also speeds up
  -- "readings for user X between date A and date B" (used by every report).
  CONSTRAINT readings_one_per_slot UNIQUE (user_id, reading_date, slot)
);

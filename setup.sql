-- Run this file in psql or pgAdmin to set up your database
-- psql -U postgres -f setup.sql

-- for local testing purposes

CREATE TABLE IF NOT EXISTS users (
  id        SERIAL PRIMARY KEY,          -- auto-incrementing integer PK
  name      VARCHAR(100) NOT NULL,       -- up to 100 chars, required
  email     VARCHAR(255) NOT NULL UNIQUE, -- must be unique across all rows
  password  TEXT NOT NULL,               -- hashed password string
  created_at TIMESTAMPTZ DEFAULT NOW()   -- auto timestamp on insert
);

-- Indexes: PostgreSQL auto-creates one for PRIMARY KEY and UNIQUE constraints.
-- You can add extra indexes for columns you query often:
-- CREATE INDEX idx_users_email ON users(email);

-- Peek at the table structure:
-- \d users

-- See all rows:
-- SELECT * FROM users;

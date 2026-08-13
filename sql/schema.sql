-- Spin the Wheel — Supabase PostgreSQL schema
-- Run this in the Supabase SQL Editor (once).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  prize TEXT,
  prize_assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  prize TEXT NOT NULL,
  game_session_id TEXT NOT NULL UNIQUE REFERENCES game_sessions (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS participants_created_at_idx
  ON participants (created_at DESC);

CREATE INDEX IF NOT EXISTS participants_contact_number_idx
  ON participants (contact_number);

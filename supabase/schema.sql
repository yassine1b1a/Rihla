-- =============================================
-- Rihla — AI Tourism Ecosystem
-- Supabase PostgreSQL Schema
-- Run in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── User Profiles ────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT NOT NULL,
  full_name          TEXT,
  avatar_url         TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','fr','ar')),
  travel_style       TEXT,
  saved_destinations TEXT[] DEFAULT '{}',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Saved Itineraries ────────────────────────────────────────────────────
CREATE TABLE itineraries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  country       TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  travel_style  TEXT,
  budget        TEXT,
  interests     TEXT[] DEFAULT '{}',
  days          JSONB NOT NULL DEFAULT '[]',
  ai_highlights TEXT[] DEFAULT '{}',
  sustainability_tips TEXT[] DEFAULT '{}',
  estimated_cost TEXT,
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Heritage Lookups (user history) ─────────────────────────────────────
CREATE TABLE heritage_searches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  input_type  TEXT,
  input_value TEXT,
  result      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Saved Destinations ───────────────────────────────────────────────────
CREATE TABLE saved_destinations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  country        TEXT NOT NULL,
  notes          TEXT,
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, destination_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_searches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_destinations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles viewable by owner" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Itineraries
CREATE POLICY "User owns itinerary" ON itineraries
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public itineraries viewable" ON itineraries
  FOR SELECT USING (is_public = TRUE);

-- Heritage searches
CREATE POLICY "User owns heritage search" ON heritage_searches
  FOR ALL USING (auth.uid() = user_id);

-- Saved destinations
CREATE POLICY "User owns saved destination" ON saved_destinations
  FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_itineraries_user    ON itineraries(user_id);
CREATE INDEX idx_itineraries_country ON itineraries(country);
CREATE INDEX idx_saved_user          ON saved_destinations(user_id);

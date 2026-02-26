-- ============================================================
-- TikTok Influencer Board — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_url TEXT NOT NULL,
  tiktok_id TEXT NOT NULL,
  influencer_name TEXT NOT NULL,
  sport_name TEXT NOT NULL,
  sport_slug TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on video edits
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Public can read everything (our API writes use the service role key which bypasses RLS)
CREATE POLICY "Public read sports" ON sports FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);

-- Seed default sports
INSERT INTO sports (name, slug) VALUES
  ('Baseball', 'baseball'),
  ('Hockey', 'hockey'),
  ('Golf', 'golf')
ON CONFLICT (slug) DO NOTHING;

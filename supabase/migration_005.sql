-- ============================================================
-- Migration 005 — run this in the Supabase SQL Editor
-- 1. Adds `active` boolean to sports (default true)
-- 2. Creates video_sports junction table (many-to-many)
-- 3. Migrates existing sport data from videos into video_sports
-- ============================================================

-- 1. Add active column to sports
ALTER TABLE sports ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 2. Create video_sports junction table
CREATE TABLE IF NOT EXISTS video_sports (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, sport_id)
);

-- 3. Migrate existing data: each video's current sport_slug → a row in video_sports
INSERT INTO video_sports (video_id, sport_id)
SELECT v.id, s.id
FROM videos v
JOIN sports s ON s.slug = v.sport_slug
ON CONFLICT DO NOTHING;

-- 4. Enable RLS and allow public reads on the junction table
ALTER TABLE video_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read video_sports" ON video_sports FOR SELECT USING (true);

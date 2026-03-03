-- ============================================================
-- Migration 009 — run this in the Supabase SQL Editor
-- 1. Adds newest_order to videos for Newest tab ordering
-- 2. Adds new sport categories
-- ============================================================

-- 1. Add newest_order column to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS newest_order INTEGER;

-- 2. Add new sport categories
INSERT INTO sports (name, slug) VALUES
  ('Lacrosse', 'lacrosse'),
  ('Snow Sports', 'snow-sports'),
  ('Football', 'football'),
  ('Racquet Sports', 'racquet-sports'),
  ('Fan Wear', 'fan-wear')
ON CONFLICT (slug) DO NOTHING;

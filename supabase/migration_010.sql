-- ============================================================
-- Migration 010 — run this in the Supabase SQL Editor
-- 1. Rename exclude_from_newest → include_in_featured (inverted logic)
-- 2. Rename newest_order → featured_order
-- ============================================================

-- 1. Add include_in_featured (default false — opt-in)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS include_in_featured BOOLEAN NOT NULL DEFAULT false;

-- 2. Rename newest_order to featured_order
ALTER TABLE videos RENAME COLUMN newest_order TO featured_order;

-- 3. Drop the old exclude_from_newest column
ALTER TABLE videos DROP COLUMN IF EXISTS exclude_from_newest;

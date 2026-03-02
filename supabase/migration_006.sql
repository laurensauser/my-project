-- ============================================================
-- Migration 006 — run this in the Supabase SQL Editor
-- 1. Adds `exclude_from_newest` boolean to videos (default false)
-- 2. Adds `description` text to sports (default empty string)
-- ============================================================

-- 1. Add exclude_from_newest to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS exclude_from_newest BOOLEAN NOT NULL DEFAULT false;

-- 2. Add description to sports
ALTER TABLE sports ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

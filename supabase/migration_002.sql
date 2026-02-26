-- ============================================================
-- Migration 002 — run this in the Supabase SQL Editor
-- Removes influencer_name, views, likes
-- Adds caption, hearts, comments, saves
-- ============================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT '';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hearts BIGINT DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comments BIGINT DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS saves BIGINT DEFAULT 0;

ALTER TABLE videos DROP COLUMN IF EXISTS influencer_name;
ALTER TABLE videos DROP COLUMN IF EXISTS views;
ALTER TABLE videos DROP COLUMN IF EXISTS likes;

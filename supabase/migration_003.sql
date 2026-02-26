
-- ============================================================
-- Migration 003 — run this in the Supabase SQL Editor
-- Replaces hearts/comments/saves with a single plays column
-- ============================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS plays BIGINT DEFAULT 0;

ALTER TABLE videos DROP COLUMN IF EXISTS hearts;
ALTER TABLE videos DROP COLUMN IF EXISTS comments;
ALTER TABLE videos DROP COLUMN IF EXISTS saves;

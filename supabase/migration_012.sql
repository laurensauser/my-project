-- ============================================================
-- Migration 012 — run this in the Supabase SQL Editor
-- Adds title column to videos for internal reference
-- ============================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

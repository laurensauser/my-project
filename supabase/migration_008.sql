-- ============================================================
-- Migration 008 — run this in the Supabase SQL Editor
-- Adds display_order to video_sports for per-sport video ordering
-- ============================================================

ALTER TABLE video_sports ADD COLUMN IF NOT EXISTS display_order INTEGER;

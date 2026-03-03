-- ============================================================
-- Migration 011 — run this in the Supabase SQL Editor
-- Adds display_order to sports for drag-and-drop reordering
-- ============================================================

ALTER TABLE sports ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Assign initial display_order based on current alphabetical order
UPDATE sports s
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn
  FROM sports
) sub
WHERE s.id = sub.id;

-- ============================================================
-- Migration 007 — run this in the Supabase SQL Editor
-- Creates site_settings table to store app-wide settings
-- (currently: description for the Newest tab)
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  newest_description TEXT NOT NULL DEFAULT '',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the one and only row
INSERT INTO site_settings (id, newest_description)
VALUES (1, '')
ON CONFLICT DO NOTHING;

-- Allow public reads (board page fetches this with the anon key)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);

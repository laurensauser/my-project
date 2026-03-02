-- migration_004: add Moms sport
INSERT INTO sports (name, slug) VALUES ('Moms', 'moms')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO test_definitions(code, name, description, is_active)
VALUES
  ('DISC', 'DISC Personality', 'Default DISC test definition', TRUE),
  ('DISC_FREE', 'DISC Free', 'Free DISC question pool', TRUE),
  ('DISC_PAID', 'DISC Paid', 'Paid DISC question pool', TRUE),
  ('BIG_FIVE', 'Big Five', 'Big Five personality test', TRUE),
  ('IKIGAI', 'IKIGAI', 'IKIGAI orientation test', TRUE)
ON CONFLICT (code) DO NOTHING;

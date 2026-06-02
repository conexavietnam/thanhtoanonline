-- Rename brand from DISCWAKE to TICAVI
UPDATE app_settings
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{siteName}',
  to_jsonb('TICAVI'::text),
  true
)
WHERE id = 1
  AND COALESCE(BTRIM(data->>'siteName'), '') IN ('', 'DISCWAKE', 'discwake', 'discCuong', 'disccuong', 'DISCCUONG');

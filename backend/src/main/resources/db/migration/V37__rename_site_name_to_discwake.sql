-- Quốc Trí: normalize the persisted site name so runtime settings stop reverting the brand back to discCuong.
UPDATE app_settings
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{siteName}',
  to_jsonb('DISCWAKE'::text),
  true
)
WHERE id = 1
  AND COALESCE(BTRIM(data->>'siteName'), '') IN ('', 'discCuong', 'disccuong', 'DISCCUONG');

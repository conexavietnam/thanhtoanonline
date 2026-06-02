-- Quốc Trí: backfill the public company profile so footer/contact pages stop showing placeholder data.
UPDATE app_settings
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(data, '{}'::jsonb),
        '{companyName}',
        CASE
          WHEN COALESCE(BTRIM(data->>'companyName'), '') = ''
            THEN to_jsonb('Công ty cổ phần đào tạo đánh thức tiềm năng Việt'::text)
          ELSE data->'companyName'
        END,
        true
      ),
      '{companyAddress}',
      CASE
        WHEN COALESCE(BTRIM(data->>'companyAddress'), '') = ''
          THEN to_jsonb('Lô 10, MB 20 Phố Thành Yên, Phường Quảng Phú, Tỉnh Thanh Hóa.'::text)
        ELSE data->'companyAddress'
      END,
      true
    ),
    '{contactPhone}',
    CASE
      WHEN COALESCE(BTRIM(data->>'contactPhone'), '') = ''
        THEN to_jsonb('0984.686.616'::text)
      ELSE data->'contactPhone'
    END,
    true
  ),
  '{contactZalo}',
  CASE
    WHEN COALESCE(BTRIM(data->>'contactZalo'), '') = ''
      THEN to_jsonb('0911586728'::text)
    ELSE data->'contactZalo'
  END,
  true
)
WHERE id = 1;

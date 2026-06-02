UPDATE app_settings
SET data = jsonb_set(
    jsonb_set(
        jsonb_set(
            data,
            '{pdfTemplateConfig,phoneNumber,0,y}',
            '244'::jsonb,
            true
        ),
        '{pdfTemplateConfig,email,0,y}',
        '206'::jsonb,
        true
    ),
    '{pdfTemplateConfig,address,0,y}',
    '168'::jsonb,
    true
)
WHERE COALESCE(data#>>'{pdfTemplateConfig,fullName,0,y}', '') = '292'
  AND (
    (
      COALESCE(data#>>'{pdfTemplateConfig,phoneNumber,0,y}', '') = '260'
      AND COALESCE(data#>>'{pdfTemplateConfig,email,0,y}', '') = '226'
      AND COALESCE(data#>>'{pdfTemplateConfig,address,0,y}', '') = '192'
    )
    OR
    (
      COALESCE(data#>>'{pdfTemplateConfig,phoneNumber,0,y}', '') = '240'
      AND COALESCE(data#>>'{pdfTemplateConfig,email,0,y}', '') = '188'
      AND COALESCE(data#>>'{pdfTemplateConfig,address,0,y}', '') = '136'
    )
  );

UPDATE app_settings
SET data = jsonb_set(
    jsonb_set(
        jsonb_set(
            data,
            '{pdfTemplateConfigPaid,phoneNumber,0,y}',
            '244'::jsonb,
            true
        ),
        '{pdfTemplateConfigPaid,email,0,y}',
        '206'::jsonb,
        true
    ),
    '{pdfTemplateConfigPaid,address,0,y}',
    '168'::jsonb,
    true
)
WHERE COALESCE(data#>>'{pdfTemplateConfigPaid,fullName,0,y}', '') = '292'
  AND (
    (
      COALESCE(data#>>'{pdfTemplateConfigPaid,phoneNumber,0,y}', '') = '260'
      AND COALESCE(data#>>'{pdfTemplateConfigPaid,email,0,y}', '') = '226'
      AND COALESCE(data#>>'{pdfTemplateConfigPaid,address,0,y}', '') = '192'
    )
    OR
    (
      COALESCE(data#>>'{pdfTemplateConfigPaid,phoneNumber,0,y}', '') = '240'
      AND COALESCE(data#>>'{pdfTemplateConfigPaid,email,0,y}', '') = '188'
      AND COALESCE(data#>>'{pdfTemplateConfigPaid,address,0,y}', '') = '136'
    )
  );

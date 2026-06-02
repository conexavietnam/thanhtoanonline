ALTER TABLE pdf_exports
  ADD COLUMN IF NOT EXISTS credits_after_export INT;

ALTER TABLE pdf_exports
  ADD COLUMN IF NOT EXISTS note TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pdf_exports'
      AND column_name = 'credits_after_export'
  ) THEN
    ALTER TABLE pdf_exports
      DROP CONSTRAINT IF EXISTS chk_pdf_exports_credits_after_export_non_negative;

    ALTER TABLE pdf_exports
      ADD CONSTRAINT chk_pdf_exports_credits_after_export_non_negative
      CHECK (credits_after_export IS NULL OR credits_after_export >= 0);
  END IF;
END $$;

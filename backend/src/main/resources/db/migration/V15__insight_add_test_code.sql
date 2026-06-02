-- Add test_code column to insights table, defaulting to 'DISC' for existing records
ALTER TABLE insights ADD COLUMN IF NOT EXISTS test_code VARCHAR(50) NOT NULL DEFAULT 'DISC';

-- Update existing insights that match known DISC dimensions
UPDATE insights SET test_code = 'DISC'
WHERE UPPER(dimension) IN ('DOMINANCE', 'INFLUENCE', 'STEADINESS', 'COMPLIANCE', 'D', 'I', 'S', 'C');

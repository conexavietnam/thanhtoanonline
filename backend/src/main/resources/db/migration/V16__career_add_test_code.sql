-- Add test_code column to careers table, defaulting to 'DISC' for existing records
ALTER TABLE careers ADD COLUMN IF NOT EXISTS test_code VARCHAR(50) NOT NULL DEFAULT 'DISC';

-- Existing careers are DISC-based (primaryDimension D/I/S/C)
UPDATE careers SET test_code = 'DISC';

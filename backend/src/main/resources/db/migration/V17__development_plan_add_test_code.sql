-- Add test_code column to development_plans table, defaulting to 'DISC' for existing records
ALTER TABLE development_plans ADD COLUMN IF NOT EXISTS test_code VARCHAR(50) NOT NULL DEFAULT 'DISC';

UPDATE development_plans SET test_code = 'DISC';

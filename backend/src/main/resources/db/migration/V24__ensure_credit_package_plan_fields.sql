-- Ensure plan-management columns exist even on databases that used an older V6 migration.

ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '';
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) DEFAULT 'ONE_TIME';
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS feature_options JSONB;
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT FALSE;
ALTER TABLE credit_packages ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

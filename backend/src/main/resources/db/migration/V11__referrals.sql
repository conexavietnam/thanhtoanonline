CREATE TYPE referral_status AS ENUM ('PENDING', 'QUALIFIED', 'PAID', 'CANCELLED');

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  referrer_email VARCHAR(255),
  referrer_full_name VARCHAR(255),
  referred_user_email VARCHAR(255),
  referred_user_full_name VARCHAR(255),

  referral_code VARCHAR(50) NOT NULL,
  status referral_status NOT NULL DEFAULT 'PENDING',

  commission_percentage NUMERIC(10,2),
  commission_amount_vnd BIGINT,
  paid_at TIMESTAMPTZ,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

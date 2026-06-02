-- =========================
-- 0) EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- =========================
-- 1) ENUMS
-- =========================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'PARTNER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM ('EMAIL', 'GOOGLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE test_mode AS ENUM ('FREE', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE export_status AS ENUM ('SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('VNPAY', 'MOMO', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credit_tx_type AS ENUM ('PURCHASE', 'EXPORT_DEDUCT', 'ADMIN_ADJUST', 'REFUND', 'BONUS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- 2) USERS + AUTH
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  auth_provider     auth_provider NOT NULL DEFAULT 'EMAIL',
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255), -- null for GOOGLE
  full_name         VARCHAR(255) NOT NULL DEFAULT '',
  avatar_url        VARCHAR(512),

  role              user_role NOT NULL DEFAULT 'USER',
  status            user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,

  pdf_credits       INT NOT NULL DEFAULT 0 CHECK (pdf_credits >= 0),

  referral_code     VARCHAR(32) UNIQUE,
  referred_by_code  VARCHAR(32),

  -- optional profile
  phone_number      VARCHAR(30),
  date_of_birth     DATE,
  address           VARCHAR(255)
);

-- Optional: use a trigger to update updated_at on changes.

CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- =========================
-- 3) CONSULTATION + TELEGRAM LOG
-- =========================
CREATE TABLE IF NOT EXISTS consultations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  name        VARCHAR(255) NOT NULL,
  phone       VARCHAR(30),
  email       VARCHAR(255),
  message     TEXT
);

CREATE TABLE IF NOT EXISTS telegram_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  chat_id         VARCHAR(64) NOT NULL,
  message_text    TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'SENT', -- SENT/FAILED
  error_text      TEXT
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_consult ON telegram_messages(consultation_id);

-- =========================
-- 4) TEST DEFINITIONS / CATEGORIES / QUESTIONS
-- =========================
-- You can keep test_code flexible: DISC_FREE, DISC_PAID, BIG_FIVE, IKIGAI...
CREATE TABLE IF NOT EXISTS test_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  test_code      VARCHAR(50) NOT NULL REFERENCES test_definitions(code) ON UPDATE CASCADE ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  weight_percent INT NOT NULL DEFAULT 0 CHECK (weight_percent >= 0 AND weight_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_categories_test_code ON categories(test_code);

-- trait_key examples:
-- DISC_D, DISC_I, DISC_S, DISC_C
-- BIG5_O, BIG5_C, BIG5_E, BIG5_A, BIG5_N
-- IKIGAI_LOVE, IKIGAI_SKILL, IKIGAI_NEED, IKIGAI_PAID
CREATE TABLE IF NOT EXISTS questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  test_code      VARCHAR(50) NOT NULL REFERENCES test_definitions(code) ON UPDATE CASCADE ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,

  content        TEXT NOT NULL,
  trait_key      VARCHAR(50) NOT NULL,
  reverse_scored BOOLEAN NOT NULL DEFAULT FALSE,
  weight         NUMERIC(10,4) NOT NULL DEFAULT 1.0 CHECK (weight > 0),

  order_index    INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_test_code ON questions(test_code);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_trait ON questions(trait_key);

-- =========================
-- 5) TEST SESSION / ANSWERS / RESULTS
-- =========================
CREATE TABLE IF NOT EXISTS test_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  owner_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  taker_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  taker_name      VARCHAR(255) NOT NULL DEFAULT '',

  test_code       VARCHAR(50) NOT NULL REFERENCES test_definitions(code) ON UPDATE CASCADE,
  mode            test_mode NOT NULL,
  status          session_status NOT NULL DEFAULT 'IN_PROGRESS',

  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,

  cost_vnd        BIGINT NOT NULL DEFAULT 0 CHECK (cost_vnd >= 0),

  note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_owner ON test_sessions(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_test_code ON test_sessions(test_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_mode ON test_sessions(mode);

CREATE TABLE IF NOT EXISTS answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id   UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  value        INT NOT NULL CHECK (value >= 1 AND value <= 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_answers_session_question ON answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);

-- result_json stores full data for charts/pairs/summary
CREATE TABLE IF NOT EXISTS results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id   UUID NOT NULL UNIQUE REFERENCES test_sessions(id) ON DELETE CASCADE,
  result_json  JSONB NOT NULL,
  summary      TEXT
);

-- =========================
-- 6) PDF EXPORTS + LEDGER CREDIT
-- =========================
CREATE TABLE IF NOT EXISTS pdf_exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  session_id    UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  mode          test_mode NOT NULL,
  status        export_status NOT NULL,

  file_path     VARCHAR(512),
  file_url      VARCHAR(512),
  error_text    TEXT
);

CREATE INDEX IF NOT EXISTS idx_pdf_exports_session ON pdf_exports(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          credit_tx_type NOT NULL,
  delta         INT NOT NULL,
  credits_after INT NOT NULL CHECK (credits_after >= 0),

  amount_vnd    BIGINT,
  ref_type      VARCHAR(30),
  ref_id        UUID,
  note          TEXT
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- =========================
-- 7) PACKAGES / ORDERS / PAYMENTS
-- =========================
CREATE TABLE IF NOT EXISTS credit_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  code        VARCHAR(50) NOT NULL UNIQUE,
  credits     INT NOT NULL CHECK (credits > 0),
  price_vnd   BIGINT NOT NULL CHECK (price_vnd > 0),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO credit_packages(code, credits, price_vnd)
VALUES
  ('PKG_1', 1, 300000),
  ('PKG_10', 10, 1000000),
  ('PKG_100', 100, 5000000),
  ('PKG_1000', 1000, 30000000)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id       UUID NOT NULL REFERENCES credit_packages(id),
  provider         payment_provider NOT NULL,
  status           order_status NOT NULL DEFAULT 'PENDING',

  amount_vnd       BIGINT NOT NULL CHECK (amount_vnd > 0),

  external_txn_id  VARCHAR(100),
  external_payload JSONB,

  note             TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider   payment_provider NOT NULL,

  event_type VARCHAR(50) NOT NULL,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  payload    JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order ON payment_events(order_id, created_at DESC);

-- =========================
-- 8) AFFILIATE
-- =========================
CREATE TABLE IF NOT EXISTS affiliate_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  percent    NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO affiliate_config(percent, is_active)
VALUES (10.00, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  partner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  percent         NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  amount_vnd      BIGINT NOT NULL CHECK (amount_vnd >= 0),

  note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_aff_earn_partner ON affiliate_earnings(partner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aff_earn_order ON affiliate_earnings(order_id);

-- =========================
-- 9) ADMIN USER VIEW (optional)
-- =========================
CREATE OR REPLACE VIEW v_admin_user_summary AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.status,
  u.pdf_credits AS paid_exports_left,
  u.referral_code,
  u.referred_by_code,
  u.created_at AS joined_at,
  COALESCE(ref.count_referred, 0) AS referred_count
FROM users u
LEFT JOIN (
  SELECT referred_by_code, COUNT(*) AS count_referred
  FROM users
  WHERE referred_by_code IS NOT NULL
  GROUP BY referred_by_code
) ref ON ref.referred_by_code = u.referral_code;

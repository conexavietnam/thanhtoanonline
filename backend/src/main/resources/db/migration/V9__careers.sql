CREATE TABLE IF NOT EXISTS careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  primary_dimension VARCHAR(50) NOT NULL,
  secondary_dimension VARCHAR(50),
  job_title TEXT NOT NULL,
  match_level INT NOT NULL DEFAULT 0 CHECK (match_level >= 0 AND match_level <= 100),
  summary TEXT,
  skills TEXT,
  learning_resources TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_plan_codes JSONB
);

CREATE INDEX IF NOT EXISTS idx_careers_primary_dimension ON careers(primary_dimension);
CREATE INDEX IF NOT EXISTS idx_careers_active ON careers(active);

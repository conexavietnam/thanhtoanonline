CREATE TABLE IF NOT EXISTS development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dimension VARCHAR(50) NOT NULL,
  focus_area TEXT NOT NULL,
  timeline VARCHAR(100),
  objectives TEXT,
  actions TEXT,
  resources TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_plan_codes JSONB
);

CREATE INDEX IF NOT EXISTS idx_dev_plans_dimension ON development_plans(dimension);
CREATE INDEX IF NOT EXISTS idx_dev_plans_active ON development_plans(active);

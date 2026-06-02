CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  dimension VARCHAR(50) NOT NULL,
  summary TEXT,
  key_behaviors TEXT,
  strengths TEXT,
  weaknesses TEXT,
  communication_style TEXT,
  leadership_style TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_plan_codes JSONB
);

CREATE INDEX IF NOT EXISTS idx_insights_category ON insights(category);
CREATE INDEX IF NOT EXISTS idx_insights_dimension ON insights(dimension);
CREATE INDEX IF NOT EXISTS idx_insights_active ON insights(active);

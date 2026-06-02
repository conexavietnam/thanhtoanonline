DO $$ BEGIN
  CREATE TYPE audit_action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email    VARCHAR(255),
  user_name     VARCHAR(255),

  action_type   audit_action_type NOT NULL,
  entity_type   VARCHAR(100),
  entity_id     VARCHAR(100),
  description   TEXT,
  ip_address    VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type, created_at DESC);

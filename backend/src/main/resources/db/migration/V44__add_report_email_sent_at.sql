ALTER TABLE test_sessions
  ADD COLUMN IF NOT EXISTS report_email_sent_at TIMESTAMPTZ;

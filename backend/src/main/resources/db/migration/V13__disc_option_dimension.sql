ALTER TABLE question_options
  ADD COLUMN IF NOT EXISTS disc_dimension VARCHAR(1) CHECK (disc_dimension IN ('D','I','S','C'));

ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS option_id UUID REFERENCES question_options(id) ON DELETE SET NULL;

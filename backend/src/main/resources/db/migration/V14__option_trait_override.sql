ALTER TABLE question_options
  ADD COLUMN IF NOT EXISTS trait_override VARCHAR(50);

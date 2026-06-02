CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value INT NOT NULL CHECK (value >= 1 AND value <= 5),
  order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

-- Seed default Likert options for existing questions (if any)
INSERT INTO question_options (question_id, label, value, order_index)
SELECT q.id, opts.label, opts.value, opts.order_index
FROM questions q
JOIN (VALUES
  ('Hoàn toàn không đồng ý', 1, 1),
  ('Không đồng ý', 2, 2),
  ('Phân vân', 3, 3),
  ('Đồng ý', 4, 4),
  ('Hoàn toàn đồng ý', 5, 5)
) AS opts(label, value, order_index) ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM question_options qo WHERE qo.question_id = q.id);

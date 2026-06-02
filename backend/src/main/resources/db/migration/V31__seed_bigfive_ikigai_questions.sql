INSERT INTO categories (test_code, name, weight_percent)
SELECT seed.test_code, seed.name, seed.weight_percent
FROM (VALUES
  ('BIG_FIVE', 'Openness', 20),
  ('BIG_FIVE', 'Conscientiousness', 20),
  ('BIG_FIVE', 'Extraversion', 20),
  ('BIG_FIVE', 'Agreeableness', 20),
  ('BIG_FIVE', 'Neuroticism', 20),
  ('IKIGAI', 'Passion', 25),
  ('IKIGAI', 'Strength', 25),
  ('IKIGAI', 'Value', 25),
  ('IKIGAI', 'Opportunity', 25)
) AS seed(test_code, name, weight_percent)
WHERE NOT EXISTS (
  SELECT 1
  FROM categories existing
  WHERE existing.test_code = seed.test_code
    AND existing.name = seed.name
);

INSERT INTO questions (test_code, category_id, content, trait_key, reverse_scored, weight, order_index)
SELECT seed.test_code, category_map.id, seed.content, seed.trait_key, seed.reverse_scored, 1.0, seed.order_index
FROM (VALUES
  ('BIG_FIVE', 1, 'Toi thich thu cach lam moi thay vi lap lai dung khuon cu.', 'BIG5_O', FALSE, 'Openness'),
  ('BIG_FIVE', 2, 'Toi cam thay thoai mai khi phai hoc mot cong cu hoac y tuong hoan toan moi.', 'BIG5_O', FALSE, 'Openness'),
  ('BIG_FIVE', 3, 'Toi thuong lap ke hoach ro rang truoc khi bat tay vao viec.', 'BIG5_C', FALSE, 'Conscientiousness'),
  ('BIG_FIVE', 4, 'Toi hay de viec quan trong sat han moi xu ly.', 'BIG5_C', TRUE, 'Conscientiousness'),
  ('BIG_FIVE', 5, 'Toi co xu huong chu dong bat chuyen va tao nang luong trong nhom.', 'BIG5_E', FALSE, 'Extraversion'),
  ('BIG_FIVE', 6, 'Toi de bi hut nang luong khi phai giao tiep voi nhieu nguoi trong thoi gian dai.', 'BIG5_E', TRUE, 'Extraversion'),
  ('BIG_FIVE', 7, 'Khi bat dong y kien, toi van co gang giu su ton trong va hop tac.', 'BIG5_A', FALSE, 'Agreeableness'),
  ('BIG_FIVE', 8, 'Toi de phan ung gay gat khi nguoi khac lam khong dung y minh.', 'BIG5_A', TRUE, 'Agreeableness'),
  ('BIG_FIVE', 9, 'Toi de lo lang qua muc truoc tinh huong chua ro rang.', 'BIG5_N', FALSE, 'Neuroticism'),
  ('BIG_FIVE', 10, 'Toi giu duoc binh tinh kha tot khi ap luc tang cao.', 'BIG5_N', TRUE, 'Neuroticism'),
  ('IKIGAI', 1, 'Toi san sang danh nhieu thoi gian cho huong di nay ngay ca khi chua ai nhac den.', 'IKIGAI_LOVE', FALSE, 'Passion'),
  ('IKIGAI', 2, 'Khi lam viec o linh vuc nay, toi thuong thay minh co nhieu nang luong hon.', 'IKIGAI_LOVE', FALSE, 'Passion'),
  ('IKIGAI', 3, 'Toi co nang luc ro rang va duoc nguoi khac ghi nhan trong linh vuc nay.', 'IKIGAI_SKILL', FALSE, 'Strength'),
  ('IKIGAI', 4, 'Khi bat tay vao viec, toi thuong lam tot phan cot loi hon mat bang chung.', 'IKIGAI_SKILL', FALSE, 'Strength'),
  ('IKIGAI', 5, 'Cong viec nay giai quyet mot nhu cau thuc te va co ich cho nguoi khac.', 'IKIGAI_NEED', FALSE, 'Value'),
  ('IKIGAI', 6, 'Toi cam thay huong di nay tao ra gia tri vuot ngoai loi ich ca nhan.', 'IKIGAI_NEED', FALSE, 'Value'),
  ('IKIGAI', 7, 'Linh vuc nay co tiem nang tro thanh nguon thu nhap ben vung cho toi.', 'IKIGAI_PAID', FALSE, 'Opportunity'),
  ('IKIGAI', 8, 'Toi nhin thay co hoi nghe nghiep hoac kinh doanh ro rang tu huong di nay.', 'IKIGAI_PAID', FALSE, 'Opportunity')
) AS seed(test_code, order_index, content, trait_key, reverse_scored, category_name)
JOIN categories category_map
  ON category_map.test_code = seed.test_code
 AND category_map.name = seed.category_name
WHERE NOT EXISTS (
  SELECT 1
  FROM questions existing
  WHERE existing.test_code = seed.test_code
    AND existing.order_index = seed.order_index
);

INSERT INTO question_options (question_id, label, value, order_index)
SELECT q.id, opts.label, opts.value, opts.order_index
FROM questions q
JOIN (VALUES
  ('Hoan toan khong dong y', 1, 1),
  ('Khong dong y', 2, 2),
  ('Phan van', 3, 3),
  ('Dong y', 4, 4),
  ('Hoan toan dong y', 5, 5)
) AS opts(label, value, order_index) ON TRUE
WHERE q.test_code IN ('BIG_FIVE', 'IKIGAI')
  AND NOT EXISTS (
    SELECT 1
    FROM question_options existing
    WHERE existing.question_id = q.id
  );

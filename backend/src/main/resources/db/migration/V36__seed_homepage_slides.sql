-- Quốc Trí: backfill the default homepage slideshow so existing environments show the three public banners.
UPDATE app_settings
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{homepageSlides}',
  '[
    {"imageUrl":"/banner1.jpg","title":"Lan tỏa lòng biết ơn","altText":"Banner dự án lan tỏa lòng biết ơn","link":""},
    {"imageUrl":"/banner2.jpg","title":"Hướng nghiệp thành công","altText":"Banner hướng nghiệp thành công","link":""},
    {"imageUrl":"/banner3.jpg","title":"Đào Ngọc Cường","altText":"Banner diễn giả Đào Ngọc Cường","link":""}
  ]'::jsonb,
  true
)
WHERE id = 1
  AND (
    NOT (COALESCE(data, '{}'::jsonb) ? 'homepageSlides')
    OR CASE
      WHEN jsonb_typeof(COALESCE(data, '{}'::jsonb)->'homepageSlides') = 'array'
        THEN jsonb_array_length(COALESCE(data, '{}'::jsonb)->'homepageSlides') = 0
      ELSE true
    END
  );

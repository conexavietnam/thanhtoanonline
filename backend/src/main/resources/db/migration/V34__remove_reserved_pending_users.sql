-- Quốc Trí: dọn các tài khoản placeholder/test chưa verify để /admin/users không còn user rác.
DELETE FROM users
WHERE auth_provider = 'EMAIL'
  AND email_verified = false
  AND status = 'PENDING_VERIFICATION'
  AND (
    lower(split_part(email, '@', 2)) IN (
      'example.com',
      'example.net',
      'example.org',
      'localhost',
      'example',
      'test',
      'invalid'
    )
    OR lower(split_part(email, '@', 2)) LIKE '%.example.com'
    OR lower(split_part(email, '@', 2)) LIKE '%.example.net'
    OR lower(split_part(email, '@', 2)) LIKE '%.example.org'
    OR lower(split_part(email, '@', 2)) LIKE '%.localhost'
    OR lower(split_part(email, '@', 2)) LIKE '%.example'
    OR lower(split_part(email, '@', 2)) LIKE '%.test'
    OR lower(split_part(email, '@', 2)) LIKE '%.invalid'
  );

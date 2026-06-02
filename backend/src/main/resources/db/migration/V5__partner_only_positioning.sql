ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'PARTNER'::user_role;

UPDATE users
SET role = 'PARTNER'::user_role
WHERE role = 'USER'::user_role;

UPDATE test_definitions
SET is_active = FALSE
WHERE code LIKE '%\\_FREE';

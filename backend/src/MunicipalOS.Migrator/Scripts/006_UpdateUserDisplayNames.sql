-- One-off data fix: update display names for specific users.
-- Safe to re-run (idempotent).

UPDATE users
SET full_name = 'Ashish Bhandari'
WHERE id = '5257e80a-1cd4-4b3c-bf5e-be5e4af51ac1';

UPDATE users
SET full_name = 'Sabitra Ojha'
WHERE id = '28e806fc-e1e8-43b7-916b-d1e19deca36b';

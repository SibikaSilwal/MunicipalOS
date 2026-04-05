-- Set expected_completion_minutes for one Nepal business day.
-- The API uses AddNepalBusinessMinutes: Mon–Fri, 10:00–17:00 Asia/Kathmandu = 7 hours = 420 minutes per day.
-- (Not calendar 24h: 1440 would be ~3.4 business days with this calculator.)

UPDATE service_types
SET expected_completion_minutes = 420
WHERE id = 'ff8ce2f8-8969-4e5a-b463-9c244acaca50';

-- FINAL FIX: Ensure exactly 7 time codes exist
-- This script will delete all existing time codes and insert exactly 7

-- Delete all existing time codes
DELETE FROM time_codes;

-- Insert exactly 7 time codes, one by one
INSERT INTO time_codes (code, name, type, rate) VALUES ('normal', 'Normal tid', 'Arbetstid', 650.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('overtime', 'Övertid', 'Arbetstid', 975.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('oncall', 'Jour', 'Arbetstid', 800.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('travel', 'Restid', 'Arbetstid', 500.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('internal', 'Intern tid', 'Interntid', 0.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('vacation', 'Semester', 'Frånvaro', 0.00);
INSERT INTO time_codes (code, name, type, rate) VALUES ('sick', 'Sjuk', 'Frånvaro', 0.00);

-- Verify: This should show exactly 7 rows
SELECT
  code,
  name,
  type,
  rate,
  COUNT(*) OVER() as total_count
FROM time_codes
ORDER BY code;

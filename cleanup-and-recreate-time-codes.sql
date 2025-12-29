-- CLEANUP AND RECREATE TIME CODES TABLE
-- This script will completely remove and recreate the time_codes table

-- Step 1: Drop the table completely (CASCADE removes all dependencies)
DROP TABLE IF EXISTS time_codes CASCADE;

-- Step 2: Create time_codes table with correct schema
CREATE TABLE time_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Arbetstid',
  rate NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE time_codes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Anyone can view time codes"
  ON time_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create time codes"
  ON time_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update time codes"
  ON time_codes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can delete time codes"
  ON time_codes FOR DELETE
  TO authenticated
  USING (true);

-- Step 5: Insert EXACTLY 7 time codes (no duplicates)
INSERT INTO time_codes (code, name, type, rate) VALUES
  ('normal', 'Normal tid', 'Arbetstid', 650.00),
  ('overtime', 'Övertid', 'Arbetstid', 975.00),
  ('oncall', 'Jour', 'Arbetstid', 800.00),
  ('travel', 'Restid', 'Arbetstid', 500.00),
  ('internal', 'Intern tid', 'Interntid', 0.00),
  ('vacation', 'Semester', 'Frånvaro', 0.00),
  ('sick', 'Sjuk', 'Frånvaro', 0.00);

-- Step 6: Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_time_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_codes_updated_at_trigger
  BEFORE UPDATE ON time_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_time_codes_updated_at();

-- Step 7: Verify the insert (should return exactly 7 rows)
SELECT
  code,
  name,
  type,
  rate,
  COUNT(*) OVER() as total_rows
FROM time_codes
ORDER BY code;

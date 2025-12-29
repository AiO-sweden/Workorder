-- Drop existing table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS time_codes CASCADE;

-- Create time_codes table with correct schema
CREATE TABLE time_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Arbetstid',
  rate NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE time_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view time codes" ON time_codes;
DROP POLICY IF EXISTS "Anyone can create time codes" ON time_codes;
DROP POLICY IF EXISTS "Anyone can update time codes" ON time_codes;
DROP POLICY IF EXISTS "Anyone can delete time codes" ON time_codes;

-- Create RLS policy - anyone authenticated can read
CREATE POLICY "Anyone can view time codes"
  ON time_codes FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policy - anyone authenticated can insert
CREATE POLICY "Anyone can create time codes"
  ON time_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policy - anyone authenticated can update
CREATE POLICY "Anyone can update time codes"
  ON time_codes FOR UPDATE
  TO authenticated
  USING (true);

-- Create RLS policy - anyone authenticated can delete
CREATE POLICY "Anyone can delete time codes"
  ON time_codes FOR DELETE
  TO authenticated
  USING (true);

-- Insert default time codes (only if table is empty)
INSERT INTO time_codes (code, name, type, rate)
SELECT * FROM (VALUES
  ('normal', 'Normal tid', 'Arbetstid', 650.00),
  ('overtime', 'Övertid', 'Arbetstid', 975.00),
  ('oncall', 'Jour', 'Arbetstid', 800.00),
  ('travel', 'Restid', 'Arbetstid', 500.00),
  ('internal', 'Intern tid', 'Interntid', 0.00),
  ('vacation', 'Semester', 'Frånvaro', 0.00),
  ('sick', 'Sjuk', 'Frånvaro', 0.00)
) AS v(code, name, type, rate)
WHERE NOT EXISTS (SELECT 1 FROM time_codes LIMIT 1);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_time_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_time_codes_updated_at_trigger ON time_codes;
CREATE TRIGGER update_time_codes_updated_at_trigger
  BEFORE UPDATE ON time_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_time_codes_updated_at();

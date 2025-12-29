-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_tidsrapporteringar_updated_at ON tidsrapporteringar;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organization time reports" ON tidsrapporteringar;
DROP POLICY IF EXISTS "Users can create time reports" ON tidsrapporteringar;
DROP POLICY IF EXISTS "Users can update their own time reports" ON tidsrapporteringar;
DROP POLICY IF EXISTS "Users can delete their own time reports" ON tidsrapporteringar;

-- Drop indexes if they exist
DROP INDEX IF EXISTS idx_tidsrapporteringar_org;
DROP INDEX IF EXISTS idx_tidsrapporteringar_order;
DROP INDEX IF EXISTS idx_tidsrapporteringar_user;
DROP INDEX IF EXISTS idx_tidsrapporteringar_date;

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS tidsrapporteringar;

-- Create tidsrapporteringar table with all required columns
CREATE TABLE tidsrapporteringar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  arbetsorder UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES schedulable_users(id) ON DELETE SET NULL,
  user_name TEXT,
  datum DATE NOT NULL,
  start_tid TIME,
  slut_tid TIME,
  antal_timmar NUMERIC(10, 2) NOT NULL,
  time_code TEXT DEFAULT 'normal',
  time_code_name TEXT DEFAULT 'Normal tid',
  time_code_color TEXT DEFAULT '#3b82f6',
  hourly_rate NUMERIC(10, 2) DEFAULT 650,
  fakturerbar BOOLEAN DEFAULT true,
  kommentar TEXT,
  godkand BOOLEAN DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tidsrapporteringar_org ON tidsrapporteringar(organization_id);
CREATE INDEX idx_tidsrapporteringar_order ON tidsrapporteringar(arbetsorder);
CREATE INDEX idx_tidsrapporteringar_user ON tidsrapporteringar(user_id);
CREATE INDEX idx_tidsrapporteringar_date ON tidsrapporteringar(datum);

-- Enable RLS
ALTER TABLE tidsrapporteringar ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view organization time reports"
  ON tidsrapporteringar FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create time reports"
  ON tidsrapporteringar FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own time reports"
  ON tidsrapporteringar FOR UPDATE
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own time reports"
  ON tidsrapporteringar FOR DELETE
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM schedulable_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_tidsrapporteringar_updated_at
  BEFORE UPDATE ON tidsrapporteringar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

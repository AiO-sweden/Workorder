-- Add organization_id column to time_codes table
-- Run this in Supabase SQL Editor

-- Add organization_id column (nullable initially to handle existing data)
ALTER TABLE time_codes
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_codes_organization ON time_codes(organization_id);

-- Optional: If you want to set a default organization for existing time codes
-- UPDATE time_codes
-- SET organization_id = (SELECT id FROM organizations LIMIT 1)
-- WHERE organization_id IS NULL;

-- Note: After running this, you may want to make organization_id NOT NULL
-- once all existing time codes have been assigned to an organization:
-- ALTER TABLE time_codes ALTER COLUMN organization_id SET NOT NULL;

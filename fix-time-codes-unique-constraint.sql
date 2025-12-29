-- Fix time_codes unique constraint to be per organization
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old unique constraint on code alone
ALTER TABLE time_codes
DROP CONSTRAINT IF EXISTS time_codes_code_key;

-- Step 2: Delete any orphaned time codes without organization_id
-- (These are from the old system before multi-tenancy)
DELETE FROM time_codes
WHERE organization_id IS NULL;

-- Step 3: Add composite unique constraint on (code, organization_id)
-- This allows each organization to have their own set of time codes
ALTER TABLE time_codes
ADD CONSTRAINT time_codes_code_organization_key
UNIQUE (code, organization_id);

-- Step 4: Make organization_id NOT NULL now that we've cleaned up
ALTER TABLE time_codes
ALTER COLUMN organization_id SET NOT NULL;

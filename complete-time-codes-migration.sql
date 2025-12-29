-- Complete Time Codes Migration with Organization Support and Colors
-- Run this entire script in Supabase SQL Editor
-- This script is idempotent (safe to run multiple times)

BEGIN;

-- Step 1: Add organization_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'time_codes' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE time_codes
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

        CREATE INDEX idx_time_codes_organization ON time_codes(organization_id);

        RAISE NOTICE 'Added organization_id column';
    ELSE
        RAISE NOTICE 'organization_id column already exists';
    END IF;
END $$;

-- Step 2: Add color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'time_codes' AND column_name = 'color'
    ) THEN
        ALTER TABLE time_codes
        ADD COLUMN color TEXT DEFAULT '#3b82f6';

        -- Update existing records
        UPDATE time_codes
        SET color = '#3b82f6'
        WHERE color IS NULL;

        RAISE NOTICE 'Added color column';
    ELSE
        RAISE NOTICE 'color column already exists';
    END IF;
END $$;

-- Step 3: Clean up orphaned records (without organization_id)
DELETE FROM time_codes
WHERE organization_id IS NULL;

-- Step 4: Fix unique constraint to be per organization
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'time_codes_code_key'
        AND table_name = 'time_codes'
    ) THEN
        ALTER TABLE time_codes DROP CONSTRAINT time_codes_code_key;
        RAISE NOTICE 'Dropped old unique constraint';
    END IF;

    -- Add new composite constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'time_codes_code_organization_key'
        AND table_name = 'time_codes'
    ) THEN
        ALTER TABLE time_codes
        ADD CONSTRAINT time_codes_code_organization_key
        UNIQUE (code, organization_id);
        RAISE NOTICE 'Added composite unique constraint';
    ELSE
        RAISE NOTICE 'Composite constraint already exists';
    END IF;
END $$;

-- Step 5: Make organization_id NOT NULL
ALTER TABLE time_codes
ALTER COLUMN organization_id SET NOT NULL;

COMMIT;

-- Step 6: Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'time_codes'
ORDER BY ordinal_position;

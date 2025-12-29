-- Add color column to time_codes table
-- Run this in Supabase SQL Editor

-- Add color column with default value
ALTER TABLE time_codes
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Update existing time codes to have the default color if NULL
UPDATE time_codes
SET color = '#3b82f6'
WHERE color IS NULL;

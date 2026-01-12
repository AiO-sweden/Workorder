-- Add description column to scheduled_jobs table
-- Run this in Supabase SQL Editor

-- Add description column for event notes/descriptions
ALTER TABLE scheduled_jobs
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN scheduled_jobs.description IS 'Notes or description for the scheduled event';

-- Update existing rows to have empty string instead of NULL
UPDATE scheduled_jobs
SET description = ''
WHERE description IS NULL;

-- Add event_type column to scheduled_jobs table
-- Run this in Supabase SQL Editor

ALTER TABLE scheduled_jobs
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'work_order' CHECK (event_type IN ('work_order', 'meeting', 'break', 'training', 'other'));

-- Add comment for documentation
COMMENT ON COLUMN scheduled_jobs.event_type IS 'Type of scheduled event: work_order, meeting, break, training, other';

-- Optional: Update existing records to have explicit event_type
UPDATE scheduled_jobs
SET event_type = 'work_order'
WHERE event_type IS NULL AND order_id IS NOT NULL;

UPDATE scheduled_jobs
SET event_type = 'other'
WHERE event_type IS NULL AND order_id IS NULL;

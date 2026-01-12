-- Add notes column to orders table
-- Run this in Supabase SQL Editor

-- Add notes column for order-specific notes/annotations
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN orders.notes IS 'Internal notes and annotations for the work order';

-- Update existing rows to have empty string instead of NULL
UPDATE orders
SET notes = ''
WHERE notes IS NULL;

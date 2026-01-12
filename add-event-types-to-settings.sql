-- Add event_types column to settings table
-- Run this in Supabase SQL Editor

-- Add event_types column with default value (JSON array)
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS event_types JSONB DEFAULT '[
  {"id": "work_order", "name": "Arbetsorder", "icon": "Wrench", "color": "#3b82f6"},
  {"id": "meeting", "name": "Möte", "icon": "Users", "color": "#8b5cf6"},
  {"id": "break", "name": "Rast/Paus", "icon": "Clock", "color": "#6b7280"},
  {"id": "training", "name": "Utbildning", "icon": "Shield", "color": "#f59e0b"},
  {"id": "other", "name": "Övrigt", "icon": "MoreHorizontal", "color": "#ec4899"}
]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN settings.event_types IS 'Customizable event types for calendar scheduling with icon and color configuration';

-- Update existing rows to have the default event_types if they are NULL
UPDATE settings
SET event_types = '[
  {"id": "work_order", "name": "Arbetsorder", "icon": "Wrench", "color": "#3b82f6"},
  {"id": "meeting", "name": "Möte", "icon": "Users", "color": "#8b5cf6"},
  {"id": "break", "name": "Rast/Paus", "icon": "Clock", "color": "#6b7280"},
  {"id": "training", "name": "Utbildning", "icon": "Shield", "color": "#f59e0b"},
  {"id": "other", "name": "Övrigt", "icon": "MoreHorizontal", "color": "#ec4899"}
]'::jsonb
WHERE event_types IS NULL;

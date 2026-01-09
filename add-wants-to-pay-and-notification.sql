-- Add wants_to_pay column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS wants_to_pay BOOLEAN DEFAULT false;

-- Create a function to call the Edge Function when a new organization is created
CREATE OR REPLACE FUNCTION notify_new_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Supabase Edge Function
  PERFORM
    net.http_post(
      url := (SELECT value FROM pg_settings WHERE name = 'app.settings.supabase_url') || '/functions/v1/notify-new-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM pg_settings WHERE name = 'app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire when new organization is inserted
DROP TRIGGER IF EXISTS on_new_organization_created ON organizations;
CREATE TRIGGER on_new_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Note: You need to enable the pg_net extension first
-- Run this in the Supabase SQL Editor:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

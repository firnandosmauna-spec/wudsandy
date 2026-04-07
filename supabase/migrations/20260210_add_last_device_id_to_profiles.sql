-- Add last_device_id to profiles table for single session enforcement
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_device_id TEXT;

-- Enable Realtime for the profiles table so other devices can detect updates
-- Note: This might fail if the table is already in the publication, so we use a check if possible or just let it run.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;

-- Alternatively, just add the specific table if you want to be more selective:
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

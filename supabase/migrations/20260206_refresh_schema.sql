-- Force PostgREST to reload the schema cache
-- Run this if you see errors like "could not find column in schema cache"

NOTIFY pgrst, 'reload schema';

-- Re-verify the column exists (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.purchases 
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

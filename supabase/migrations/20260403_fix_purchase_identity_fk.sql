-- Ensure user_id column exists in purchases and is linked to profiles for report joining
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchases' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.purchases ADD COLUMN user_id UUID;
    END IF;

    -- Add separate REFERENCES to public.profiles if relationship is missing
    -- This allows "profiles(full_name)" join in Supabase select
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchases_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.purchases
        ADD CONSTRAINT purchases_user_id_profiles_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing records: if user_id is null, it stays null (handled by UI)
-- But new records from POS will now have user_id correctly linked.

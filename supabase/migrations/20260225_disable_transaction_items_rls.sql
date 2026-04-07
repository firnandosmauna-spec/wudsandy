-- NUCLEAR OPTION: Temporarily disable ALL RLS on transaction_items to debug if RLS is the actual cause of the sync failure

-- 1. Disable RLS entirely on the table
ALTER TABLE public.transaction_items DISABLE ROW LEVEL SECURITY;

-- 2. (Optional but good for cleanup) Drop any and all policies on the table just in case they interfere later when re-enabled
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'transaction_items') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.transaction_items', r.policyname);
    END LOOP;
END $$;

-- Fix ALL RLS policies for transaction_items to ensure offline sync (upsert) works perfectly
DO $$ 
BEGIN
    -- DROP existing policies to reset them cleanly
    DROP POLICY IF EXISTS "Auth Insert Transaction Items" ON public.transaction_items;
    DROP POLICY IF EXISTS "Auth Update Transaction Items" ON public.transaction_items;

    -- CREATE INSERT Policy
    CREATE POLICY "Auth Insert Transaction Items" ON public.transaction_items 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

    -- CREATE UPDATE Policy (required for UPSERT)
    CREATE POLICY "Auth Update Transaction Items" ON public.transaction_items 
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

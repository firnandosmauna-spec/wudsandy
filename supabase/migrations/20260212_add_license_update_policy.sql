-- Add update policy for licenses table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'licenses' AND policyname = 'Apps can update licenses'
    ) THEN
        CREATE POLICY "Apps can update licenses" ON public.licenses
            FOR UPDATE USING (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- Ensure server_id and server_name exist in transactions
DO $$ 
BEGIN
    -- Add server_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'server_id') THEN
        ALTER TABLE public.transactions ADD COLUMN server_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add server_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'server_name') THEN
        ALTER TABLE public.transactions ADD COLUMN server_name TEXT;
    END IF;
END $$;

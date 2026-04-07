-- Add description column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE public.products ADD COLUMN description TEXT;
    END IF;
END $$;

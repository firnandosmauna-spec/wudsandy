-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
DROP POLICY IF EXISTS "Customers are public" ON public.customers;
CREATE POLICY "Customers are public" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage customers" ON public.customers;
CREATE POLICY "Authenticated can manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

-- Ensure image_url column exists in products (in case it was missed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
END $$;

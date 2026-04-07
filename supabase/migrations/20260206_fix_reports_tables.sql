-- Ensure purchases table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    invoice_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies for Purchases
DROP POLICY IF EXISTS "Public Read Purchases" ON public.purchases;
CREATE POLICY "Public Read Purchases" ON public.purchases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth Insert Purchases" ON public.purchases;
CREATE POLICY "Auth Insert Purchases" ON public.purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure Transactions RLS is definitely correct
DROP POLICY IF EXISTS "Public Read Transactions" ON public.transactions;
CREATE POLICY "Public Read Transactions" ON public.transactions FOR SELECT USING (true);

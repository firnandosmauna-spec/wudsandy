-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    payment_method TEXT NOT NULL,
    table_number TEXT,
    customer_id UUID, -- Optional foreign key if you want strict integrity: REFERENCES public.customers(id)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id), -- Optional: REFERENCES public.products(id)
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Policies (Public Read, Authenticated Insert/Update for now)
CREATE POLICY "Public Read Transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Auth Insert Transactions" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update Transactions" ON public.transactions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Transaction Items" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Auth Insert Transaction Items" ON public.transaction_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for transactions (Again, just to be sure)
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Create cash_registers table
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    branch_id UUID REFERENCES public.branches(id),
    opening_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closing_time TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    closing_balance NUMERIC,
    total_sales NUMERIC DEFAULT 0,
    expected_balance NUMERIC DEFAULT 0,
    actual_balance NUMERIC,
    difference NUMERIC,
    status TEXT DEFAULT 'open', -- 'open' or 'closed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add cash_register_id to transactions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'cash_register_id') THEN
        ALTER TABLE public.transactions ADD COLUMN cash_register_id UUID REFERENCES public.cash_registers(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own registers" ON public.cash_registers
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can open registers" ON public.cash_registers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registers" ON public.cash_registers
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

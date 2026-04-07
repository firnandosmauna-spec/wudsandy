-- Add table_number column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS table_number TEXT;

-- Also ensure customer_id exists if we are using it
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS customer_id UUID;

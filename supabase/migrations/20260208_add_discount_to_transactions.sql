-- Add discount column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0;

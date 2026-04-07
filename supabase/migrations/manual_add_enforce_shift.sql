-- Add enforce_shift column to store_configs table
ALTER TABLE public.store_configs 
ADD COLUMN IF NOT EXISTS enforce_shift BOOLEAN DEFAULT false;

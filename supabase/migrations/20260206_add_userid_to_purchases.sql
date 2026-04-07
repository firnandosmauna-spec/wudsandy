-- Add user_id column to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policy to allow insert with user_id
DROP POLICY IF EXISTS "Auth Insert Purchases" ON public.purchases;
CREATE POLICY "Auth Insert Purchases" ON public.purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');

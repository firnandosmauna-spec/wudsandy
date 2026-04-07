-- Add UPDATE and DELETE policies for purchases table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Auth Update Purchases" ON public.purchases;
DROP POLICY IF EXISTS "Auth Delete Purchases" ON public.purchases;

-- Allow authenticated users to update purchases
CREATE POLICY "Auth Update Purchases" 
ON public.purchases 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete purchases
CREATE POLICY "Auth Delete Purchases" 
ON public.purchases 
FOR DELETE 
USING (auth.role() = 'authenticated');

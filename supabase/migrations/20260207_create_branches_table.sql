-- Create branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add branch_id to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Add branch_id to profiles (for default branch assignment)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Add branch_id to purchases
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Enable RLS for branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so cashiers can select branch)
CREATE POLICY "Branches are viewable by everyone" ON public.branches
  FOR SELECT USING (true);

-- Allow insert/update only for admins (we will assume authenticated users for now, or refine later)
CREATE POLICY "Authenticated users can insert branches" ON public.branches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update branches" ON public.branches
  FOR UPDATE USING (auth.role() = 'authenticated');

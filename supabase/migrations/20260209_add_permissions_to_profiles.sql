-- Add permissions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"history": true, "reports": false, "products": false, "store": false, "users": false, "purchases": true}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.permissions IS 'Stores granular access permissions for the user (mostly for cashiers).';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

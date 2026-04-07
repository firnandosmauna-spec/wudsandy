-- Reset and fix RLS for device_activations
-- This ensures the app can register its trial correctly

-- 1. Ensure Table Exists (just in case)
CREATE TABLE IF NOT EXISTS public.device_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT UNIQUE NOT NULL,
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_trial_active BOOLEAN DEFAULT TRUE
);

-- 2. Enable RLS
ALTER TABLE public.device_activations ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts (both old and new names)
DROP POLICY IF EXISTS "Apps can check activations" ON public.device_activations;
DROP POLICY IF EXISTS "Apps can insert activations" ON public.device_activations;
DROP POLICY IF EXISTS "Apps can update own trial" ON public.device_activations;
DROP POLICY IF EXISTS "Public can check activations" ON public.device_activations;
DROP POLICY IF EXISTS "Public can register trials" ON public.device_activations;
DROP POLICY IF EXISTS "Public can update activations" ON public.device_activations;

-- 4. Create proper policies for public/anonymous access
-- Since this is for trial registration, we need to allow anonymous inserts
CREATE POLICY "Public can check activations" ON public.device_activations
    FOR SELECT USING (true);

CREATE POLICY "Public can register trials" ON public.device_activations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update activations" ON public.device_activations
    FOR UPDATE USING (true);

-- 5. Ensure GRANTS for anon and authenticated roles
GRANT ALL ON public.device_activations TO anon;
GRANT ALL ON public.device_activations TO authenticated;
GRANT ALL ON public.device_activations TO service_role;

-- Also check licenses table
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can check license existence" ON public.licenses;
CREATE POLICY "Public can check license existence" ON public.licenses
    FOR SELECT USING (true);

GRANT ALL ON public.licenses TO anon;
GRANT ALL ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';

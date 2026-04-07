-- 1. Add logo_url column to store_configs
ALTER TABLE public.store_configs 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Create the 'store-logos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Policies for storage.objects in 'store-logos' bucket
-- Allow public read access
DROP POLICY IF EXISTS "Public Store Logo Access" ON storage.objects;
CREATE POLICY "Public Store Logo Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-logos' );

-- Allow authenticated users to upload/update/delete
DROP POLICY IF EXISTS "Authenticated Store Logo Upload" ON storage.objects;
CREATE POLICY "Authenticated Store Logo Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'store-logos' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Store Logo Update" ON storage.objects;
CREATE POLICY "Authenticated Store Logo Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'store-logos' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Store Logo Delete" ON storage.objects;
CREATE POLICY "Authenticated Store Logo Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'store-logos' AND auth.role() = 'authenticated' );

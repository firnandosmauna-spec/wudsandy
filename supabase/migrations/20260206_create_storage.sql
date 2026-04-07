-- 1. Create the 'products' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Skip Enabling RLS on storage.objects (It is usually already enabled and requires superuser to change)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for storage.objects
-- Allow public read access to all objects in 'products' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Allow authenticated users to upload files to 'products' bucket
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'products' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their files (optional)
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'products' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete files (optional)
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'products' AND auth.role() = 'authenticated' );

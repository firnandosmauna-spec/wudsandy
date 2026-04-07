-- 1. Sync semua user yang ada di auth.users ke public.profiles (jika belum ada)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    'cashier' -- Default role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Update role menjadi 'admin' untuk email tertentu
-- GANTI 'EMAIL_ANDA_DISINI' dengan email login Anda
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'EMAIL_ANDA_DISINI';

-- 3. Cek hasilnya
SELECT * FROM public.profiles WHERE email = 'EMAIL_ANDA_DISINI';

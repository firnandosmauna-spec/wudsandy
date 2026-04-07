-- Ganti 'EMAIL_ANDA_DISINI' dengan email login Anda
-- Contoh: 'budi@gmail.com'

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'EMAIL_ANDA_DISINI';

-- Verifikasi perubahan
SELECT * FROM public.profiles WHERE email = 'EMAIL_ANDA_DISINI';

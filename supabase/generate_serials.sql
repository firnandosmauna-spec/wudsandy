-- SQL Script to generate 10 Serial Numbers
-- Run this in the Supabase SQL Editor (https://app.supabase.com)

INSERT INTO public.licenses (serial_number)
VALUES 
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4))),
    (upper(substring(md5(random()::text), 1, 4)) || '-' || upper(substring(md5(random()::text), 5, 4)) || '-' || upper(substring(md5(random()::text), 9, 4)) || '-' || upper(substring(md5(random()::text), 13, 4)));

-- Query to view available licenses:
-- SELECT serial_number FROM public.licenses WHERE is_used = false;

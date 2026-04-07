-- Check if store_configs has data
SELECT * FROM public.store_configs;

-- If no data, insert a test record
INSERT INTO public.store_configs (store_name, store_address, store_phone)
VALUES ('Test Store', 'Test Address', '08123456789')
ON CONFLICT DO NOTHING;

-- Check again
SELECT * FROM public.store_configs;

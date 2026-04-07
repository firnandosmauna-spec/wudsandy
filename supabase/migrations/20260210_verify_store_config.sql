-- Check if store_configs table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'store_configs'
ORDER BY ordinal_position;

-- Check if there's any data
SELECT * FROM public.store_configs LIMIT 5;

-- If no data exists, insert default settings
INSERT INTO public.store_configs (settings)
SELECT '{"showTable": true, "showRecall": true, "showGuest": true, "showManual": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.store_configs);

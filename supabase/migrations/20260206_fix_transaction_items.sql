-- Make product_id nullable to support custom items or deleted products
ALTER TABLE public.transaction_items 
ALTER COLUMN product_id DROP NOT NULL;

-- Add product_name column to store the name snapshot at time of purchase
ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Update existing records to have product_name from products table (optional, but good for data integrity)
UPDATE public.transaction_items ti
SET product_name = p.name
FROM public.products p
WHERE ti.product_id = p.id
AND ti.product_name IS NULL;

-- Add cost_price column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) DEFAULT 0;

-- Add cost_price column to transaction_items to track cost at time of sale
ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) DEFAULT 0;

-- Update existing transaction_items to have cost_price = 0 (for historical data)
UPDATE public.transaction_items 
SET cost_price = 0 
WHERE cost_price IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.cost_price IS 'Cost price (harga modal) of the product';
COMMENT ON COLUMN public.transaction_items.cost_price IS 'Cost price at time of sale for accurate COGS calculation';

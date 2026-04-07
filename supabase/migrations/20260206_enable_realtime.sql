-- Enable Realtime for products and categories tables
-- This ensures that 'postgres_changes' events are sent to subscribed clients

-- Add 'products' table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Add 'categories' table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

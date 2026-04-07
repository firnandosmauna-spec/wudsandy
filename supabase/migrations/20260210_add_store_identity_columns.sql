-- Add store identity columns to store_configs table
ALTER TABLE public.store_configs 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS store_phone TEXT,
ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS footer_message TEXT,
ADD COLUMN IF NOT EXISTS paper_size TEXT DEFAULT '58mm',
ADD COLUMN IF NOT EXISTS auto_print BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_qris BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_transfer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_debit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_credit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_table_number BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_customer_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cashier_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_server_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_order_date BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_discount BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_preview_before_pay BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON TABLE public.store_configs IS 'Centralized store configuration including identity, UI preferences, printer settings, and receipt options';

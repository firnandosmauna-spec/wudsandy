-- Add indexes to improve query performance on transactions and related tables

-- Transactions Table Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Transaction Items Table Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product_id ON public.transaction_items(product_id);

-- Customers Table Indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Products Table Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

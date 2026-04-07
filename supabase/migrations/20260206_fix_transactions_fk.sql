-- Add Foreign Key constraint to transactions.customer_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_customer_id_fkey'
    ) THEN
        ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES public.customers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

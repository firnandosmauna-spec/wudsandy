-- Fix Product Deletion Issue
-- The default foreign key constraint prevents deleting a product if it has been sold (exists in transaction_items).
-- We need to change the behavior to SET NULL when a product is deleted, preserving the transaction record but removing the link to the deleted product.

DO $$
BEGIN
    -- 1. Try to drop the constraint by its standard name
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'transaction_items_product_id_fkey'
        AND table_name = 'transaction_items'
    ) THEN
        ALTER TABLE public.transaction_items DROP CONSTRAINT transaction_items_product_id_fkey;
    END IF;

    -- 2. Also try to drop any other constraint on product_id if the name was different (unlikely but safe)
    -- This is harder to do safely without more complex PL/PGSQL, so we rely on the standard name or manual inspection if this fails.

    -- 3. Add the new constraint with ON DELETE SET NULL
    ALTER TABLE public.transaction_items
    ADD CONSTRAINT transaction_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;

END $$;

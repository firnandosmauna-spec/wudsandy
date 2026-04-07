-- Comprehensive Fix for Product Deletion
-- We found two tables referencing products: 'transaction_items' and likely 'order_items' (legacy).
-- Both need to effectively 'release' the product when it is deleted.

-- PART 1: transaction_items
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop ALL foreign key constraints on transaction_items.product_id
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.key_column_usage
        WHERE table_name = 'transaction_items' AND column_name = 'product_id'
        AND position_in_unique_constraint IS NOT NULL
    ) LOOP
        EXECUTE 'ALTER TABLE public.transaction_items DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
    
    -- Re-add the correct constraint
    ALTER TABLE public.transaction_items
    ADD CONSTRAINT transaction_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id)
    ON DELETE SET NULL;
END $$;


-- PART 2: order_items (Legacy table, but might still have data/constraints)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Only proceed if order_items exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        
        -- 1. Make product_id nullable (it was NOT NULL originally)
        ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

        -- 2. Find and drop ALL foreign key constraints on order_items.product_id
        FOR r IN (
            SELECT constraint_name
            FROM information_schema.key_column_usage
            WHERE table_name = 'order_items' AND column_name = 'product_id'
            AND position_in_unique_constraint IS NOT NULL
        ) LOOP
            EXECUTE 'ALTER TABLE public.order_items DROP CONSTRAINT ' || r.constraint_name;
        END LOOP;

        -- 3. Re-add the correct constraint
        ALTER TABLE public.order_items
        ADD CONSTRAINT order_items_product_id_fkey
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON DELETE SET NULL;
        
    END IF;
END $$;

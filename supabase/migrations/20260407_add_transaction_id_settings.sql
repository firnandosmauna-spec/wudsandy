-- Migration: Add Transaction ID Settings and Receipt Numbers
-- Date: 2026-04-07

-- 1. Add settings to store_configs
ALTER TABLE public.store_configs 
ADD COLUMN IF NOT EXISTS transaction_id_mode TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS transaction_prefix TEXT DEFAULT 'TRX';

-- 2. Add receipt_number to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- 3. Backfill receipt_number with a short UUID for existing transactions (optional but helpful)
UPDATE public.transactions 
SET receipt_number = LEFT(id::text, 8) 
WHERE receipt_number IS NULL;

-- 4. Add index for faster searching by receipt number
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_number ON public.transactions(receipt_number);

COMMENT ON COLUMN public.store_configs.transaction_id_mode IS 'Mode ID Transaksi: "auto" (sistem generate) atau "manual" (user input)';
COMMENT ON COLUMN public.store_configs.transaction_prefix IS 'Awalan ID transaksi otomatis (misal: TRX, INV, dll)';
COMMENT ON COLUMN public.transactions.receipt_number IS 'ID Transaksi human-readable (manual/auto)';

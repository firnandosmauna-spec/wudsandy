-- Add index on branch_id for transactions table to speed up filtered lookups
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON public.transactions(branch_id);

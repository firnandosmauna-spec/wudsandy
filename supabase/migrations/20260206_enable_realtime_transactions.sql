-- Enable Realtime for transactions table
-- This ensures that 'postgres_changes' events (specifically INSERTs) are sent to subscribed clients like the Dashboard

-- Add 'transactions' table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

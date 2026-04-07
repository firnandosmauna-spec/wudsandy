-- Add server_id and server_name to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS server_name TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_server_id ON transactions(server_id);

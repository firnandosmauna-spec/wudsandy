-- Add trial days and activation strategy to store_configs
ALTER TABLE public.store_configs 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS activation_strategy TEXT DEFAULT 'wait';

-- Update comment
COMMENT ON COLUMN public.store_configs.trial_days IS 'Number of free trial days for new devices';
COMMENT ON COLUMN public.store_configs.activation_strategy IS 'How common devices should handle activation (direct = force immediately, wait = allow trial)';

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';

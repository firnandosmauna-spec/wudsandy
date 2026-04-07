-- Create store_configs table to sync settings across devices
CREATE TABLE IF NOT EXISTS public.store_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE, -- Nullable for global settings
    settings JSONB NOT NULL DEFAULT '{"showTable": true, "showRecall": true, "showGuest": true, "showManual": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.store_configs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read settings (authenticated users)
CREATE POLICY "Authorized users can view store configs" ON public.store_configs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can update (Cashiers/Admins)
CREATE POLICY "Authorized users can update store configs" ON public.store_configs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow insert (usually done once, or for new branches)
CREATE POLICY "Authorized users can insert store configs" ON public.store_configs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_configs;

-- Trigger for updated_at
-- Assuming public.handle_updated_at or similar exists, or creating inline
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS on_store_configs_updated ON public.store_configs;
CREATE TRIGGER on_store_configs_updated
    BEFORE UPDATE ON public.store_configs
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

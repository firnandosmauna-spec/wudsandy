-- Create coffee_powder_inventory table
CREATE TABLE IF NOT EXISTS public.coffee_powder_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    current_stock NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'gram',
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create coffee_powder_logs table
CREATE TABLE IF NOT EXISTS public.coffee_powder_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coffee_powder_id UUID REFERENCES public.coffee_powder_inventory(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    amount NUMERIC NOT NULL,
    description TEXT,
    branch_id UUID REFERENCES public.branches(id),
    user_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coffee_powder_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_powder_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Coffee Powder Inventory
CREATE POLICY "Public Read Coffee Powder Inventory" ON public.coffee_powder_inventory 
    FOR SELECT USING (true);
CREATE POLICY "Auth Manage Coffee Powder Inventory" ON public.coffee_powder_inventory 
    FOR ALL WITH CHECK (auth.role() = 'authenticated');

-- Policies for Coffee Powder Logs
CREATE POLICY "Public Read Coffee Powder Logs" ON public.coffee_powder_logs 
    FOR SELECT USING (true);
CREATE POLICY "Auth Manage Coffee Powder Logs" ON public.coffee_powder_logs 
    FOR ALL WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime (Optional if publication is FOR ALL TABLES)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_powder_inventory;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_powder_logs;

-- Function and trigger for updating updated_at
CREATE TRIGGER update_coffee_powder_inventory_updated_at
BEFORE UPDATE ON public.coffee_powder_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

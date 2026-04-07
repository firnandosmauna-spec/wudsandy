-- Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public read access
CREATE POLICY "Tables are publicly readable" ON public.tables FOR SELECT USING (true);

-- Authenticated users can manage tables
CREATE POLICY "Authenticated can manage tables" ON public.tables FOR ALL USING (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- Create trigger for updated_at
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

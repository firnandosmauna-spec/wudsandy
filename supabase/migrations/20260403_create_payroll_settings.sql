-- Create payroll_settings table
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  base_salary NUMERIC DEFAULT 0,
  daily_allowance NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0, -- Persentase komisi (0-100)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Admin can manage all payroll settings
CREATE POLICY "Admins can manage all payroll settings" ON public.payroll_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. Staff can view their own payroll settings
CREATE POLICY "Staff can view own payroll settings" ON public.payroll_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON public.payroll_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_payroll_updated_at();

-- Update handle_new_user function to include permissions from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, permissions)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'cashier'),
    (new.raw_user_meta_data->'permissions')::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

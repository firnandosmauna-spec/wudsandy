-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to update password (only for Admins)
CREATE OR REPLACE FUNCTION public.update_user_password(
  target_user_id UUID, 
  new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if the executor is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Admins can reset passwords.';
  END IF;

  -- Update the password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

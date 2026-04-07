-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Update handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, username)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'cashier'),
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple logic to populate username for existing users if missing
UPDATE public.profiles 
SET username = LOWER(REPLACE(full_name, ' ', '.'))
WHERE username IS NULL AND full_name IS NOT NULL;

UPDATE public.profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

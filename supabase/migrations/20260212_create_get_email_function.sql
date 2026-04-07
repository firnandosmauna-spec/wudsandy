-- Create a secure function to look up email by identifier (username or full_name)
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator 
-- (bypassing RLS on profiles table), allowing anonymous users to use it during login.

CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Bypasses RLS
SET search_path = public -- Secure search path
AS $$
DECLARE
  found_email text;
BEGIN
  -- Try finding by username (case-insensitive)
  SELECT email INTO found_email
  FROM profiles
  WHERE LOWER(username) = LOWER(identifier_input)
  LIMIT 1;

  -- If not found, try finding by full_name (case-insensitive)
  IF found_email IS NULL THEN
    SELECT email INTO found_email
    FROM profiles
    WHERE LOWER(full_name) = LOWER(identifier_input)
    LIMIT 1;
  END IF;

  RETURN found_email;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon, authenticated, service_role;

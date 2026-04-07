-- Enable DELETE for users with 'admin' role
CREATE POLICY "Enable delete for users based on role" ON "public"."profiles"
AS PERMISSIVE FOR DELETE
TO public
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Also allow admins to UPDATE any profile (to promote/demote users)
CREATE POLICY "Enable update for users based on role" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO public
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

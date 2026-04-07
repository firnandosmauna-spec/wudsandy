-- Allow Admins and Owners to UPDATE cash_registers (to close them)
-- Previously only SELECT was allowed or limited updates.

DROP POLICY IF EXISTS "Admin/Owner Update All" ON public.cash_registers;

CREATE POLICY "Admin/Owner Update All"
ON public.cash_registers FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')))
);

-- Ensure Realtime is enabled for cash_registers so AuthContext can listen
ALTER PUBLICATION supabase_realtime ADD TABLE cash_registers;

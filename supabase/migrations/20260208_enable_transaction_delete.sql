-- Enable DELETE for authenticated users on transactions table
CREATE POLICY "Auth Delete Transactions" ON public.transactions FOR DELETE USING (auth.role() = 'authenticated');

-- Also enable DELETE for transaction_items if cascading doesn't handle permission check (it usually does via owner, but good to be explicit if RLS is on for items)
CREATE POLICY "Auth Delete Transaction Items" ON public.transaction_items FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS (just in case)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- PRODUCTS TABLE POLICIES --

-- Allow public read access (Already exists, but ensuring it)
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Allow Authenticated users to INSERT products
DROP POLICY IF EXISTS "Authenticated can insert products" ON public.products;
CREATE POLICY "Authenticated can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow Authenticated users to UPDATE products
DROP POLICY IF EXISTS "Authenticated can update products" ON public.products;
CREATE POLICY "Authenticated can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow Authenticated users to DELETE products
DROP POLICY IF EXISTS "Authenticated can delete products" ON public.products;
CREATE POLICY "Authenticated can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');


-- CATEGORIES TABLE POLICIES --

-- Allow public read access
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Allow Authenticated users to manage categories (Insert, Update, Delete)
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.categories;
CREATE POLICY "Authenticated can manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

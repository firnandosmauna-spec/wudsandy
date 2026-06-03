-- SQL Migration to Seed Demo Data for WUD CAKE N BAKE (FULL DEMO VERSION)
-- Run this in the Supabase SQL Editor

-- 1. Seed Categories with Fixed IDs
INSERT INTO public.categories (id, name)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Roti Manis'),
  ('c1000000-0000-0000-0000-000000000002', 'Pastry & Croissant'),
  ('c1000000-0000-0000-0000-000000000003', 'Whole Cakes'),
  ('c1000000-0000-0000-0000-000000000004', 'Dessert Box')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed Products (Full Catalog - 12 Products)
DELETE FROM public.products WHERE description LIKE '%(Demo Data)%';

INSERT INTO public.products (name, price, stock, category_id, image_url, description)
VALUES 
  ('Premium Butter Croissant', 18000, 50, 'c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800', 'Croissant klasik dengan mentega Prancis asli. (Demo Data)'),
  ('Strawberry Cheesecake', 45000, 20, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800', 'Cheesecake lembut dengan topping strawberry segar. (Demo Data)'),
  ('Tiramisu Signature Box', 35000, 30, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=800', 'Dessert box kopi espresso dan krim mascarpone. (Demo Data)'),
  ('Artisan Sourdough Bread', 42000, 15, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1585478259715-876a6a81fc08?auto=format&fit=crop&q=80&w=800', 'Roti sehat proses fermentasi alami. (Demo Data)'),
  ('Chocolate Lava Cake', 28000, 25, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=800', 'Kue coklat dengan lelehan pasta coklat belgian. (Demo Data)'),
  ('Almond Danish Pastry', 22000, 40, 'c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 'Pastry berlapis dengan isian krim almond. (Demo Data)'),
  ('Red Velvet Cake', 48000, 15, 'c1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1586788680434-30d324631ff6?auto=format&fit=crop&q=80&w=800', 'Kue Red Velvet klasik dengan lapisan cream cheese premium. (Demo Data)'),
  ('Lotus Biscoff Dessert', 38000, 30, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800', 'Dessert box dengan rasa biskuit Lotus Biscoff yang fenomenal. (Demo Data)'),
  ('Pain au Chocolat', 20000, 45, 'c1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&q=80&w=800', 'Pastry coklat ala Prancis dengan adonan yang sangat renyah. (Demo Data)'),
  ('Roti Sisir Mentega', 15000, 60, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&q=80&w=800', 'Roti sisir tradisional yang lembut dengan olesan mentega spesial. (Demo Data)'),
  ('Matcha Glazed Donut', 12000, 50, 'c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800', 'Donat lembut dengan lapisan glaze green tea asli dari Jepang. (Demo Data)'),
  ('Banoffee Pie Box', 35000, 20, 'c1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800', 'Perpaduan pisang, karamel, dan whipped cream dalam satu box. (Demo Data)');

-- 3. Seed CMS Content
INSERT INTO public.landing_cms (section_id, content)
VALUES 
(
  'hero', 
  '{
    "title": "Bakery Fresh From the Oven",
    "subtitle": "Temukan berbagai pilihan menu premium yang dibuat dengan penuh kasih sayang untuk setiap momen berharga Anda.",
    "cta_text": "Belanja Sekarang",
    "secondary_cta_text": "Tentang Kami",
    "images": [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&q=80&w=1600"
    ]
  }'::jsonb
),
(
  'about', 
  '{
    "badge": "Authentic Bakery",
    "title": "Warisan Rasa Sejak Dahulu",
    "description": "Berawal dari kegemaran keluarga, WUD CAKE N BAKE kini hadir membawa keajaiban rasa roti dan kue artisan ke rumah Anda."
  }'::jsonb
),
(
  'features', 
  '[
    { "title": "Bahan Organik", "description": "Hanya menggunakan tepung dan mentega berkualitas tinggi tanpa pengawet." },
    { "title": "Segar Setiap Hari", "description": "Dipanggang langsung setiap pagi untuk menjamin tekstur dan rasa terbaik." },
    { "title": "Pengiriman Cepat", "description": "Layanan antar khusus agar pesanan sampai ke tangan Anda tetap sempurna." }
  ]'::jsonb
)
ON CONFLICT (section_id) DO UPDATE SET content = EXCLUDED.content;

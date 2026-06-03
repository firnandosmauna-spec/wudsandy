-- Create landing_cms table
CREATE TABLE IF NOT EXISTS public.landing_cms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.landing_cms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to landing_cms" ON public.landing_cms
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update landing_cms" ON public.landing_cms
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial data
INSERT INTO public.landing_cms (section_id, content) VALUES
('hero', '{
    "title": "Solusi POS Modern",
    "subtitle": "Kelola bisnis Anda lebih cepat dan pintar",
    "image_url": "/wudkopi-logo.png",
    "cta_text": "Pesan Sekarang",
    "secondary_cta_text": "Tentang Kami"
}'),
('features', '[
    {
        "icon": "Zap",
        "title": "Transaksi Instan",
        "description": "Proses pembayaran kurang dari 3 detik dengan antarmuka kasir yang intuitif."
    },
    {
        "icon": "BarChart3",
        "title": "Laporan Real-time",
        "description": "Pantau omzet, laba rugi, dan stok barang secara real-time dari mana saja."
    },
    {
        "icon": "Smartphone",
        "title": "Mobile Ready",
        "description": "Akses dashboard dan kasir langsung dari smartphone Anda tanpa hardware mahal."
    }
]'),
('about', '{
    "badge": "Multiguna",
    "title": "Didesain untuk Berbagai Jenis Usaha Anda",
    "description": "Apapun bisnisnya, WUDkopi hadir sebagai solusi manajemen operasional yang andal. Sederhanakan proses kerja dan fokuslah pada pertumbuhan bisnis Anda.",
    "items": [
        {"icon": "Coffee", "text": "Coffee Shop & Café"},
        {"icon": "ShoppingBag", "text": "Retail & Minimarket"},
        {"icon": "ShieldCheck", "text": "Jasa & Layanan"}
    ]
}')
ON CONFLICT (section_id) DO UPDATE SET content = EXCLUDED.content;

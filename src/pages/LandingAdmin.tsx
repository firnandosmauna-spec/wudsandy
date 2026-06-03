import { useState, useEffect } from 'react';
import { useLandingCMS, LandingHero, LandingFeature, LandingAbout } from '@/hooks/useLandingCMS';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Save, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Layout, 
  Zap, 
  Info,
  CheckCircle2,
  Globe,
  Palette,
  Users,
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import WebUserManagement from './Users/WebUserManagement';
import { useAuth } from '@/hooks/useAuth';

export default function LandingAdmin() {
  const { user } = useAuth();
  const { data: cms, isLoading } = useLandingCMS();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');

  const updateMutation = useMutation({
    mutationFn: async ({ section_id, content }: { section_id: string, content: any }) => {
      const { error } = await supabase
        .from('landing_cms')
        .upsert({ 
          section_id, 
          content
        }, { onConflict: 'section_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing_cms'] });
      toast.success('Pengaturan berhasil disimpan');
    },
    onError: (error: any) => {
      toast.error('Gagal menyimpan pengaturan', { description: error.message });
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#5d4037] uppercase tracking-tight">Kelola Web Store</h1>
          <p className="text-[#ec4899] mt-1 font-bold text-xs uppercase tracking-widest">Atur tampilan dan konten toko bakery Anda</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.open('/', '_blank')}
          className="rounded-xl border-2 border-primary/20 hover:bg-primary/5 gap-2"
        >
          <Globe className="h-4 w-4" />
          Lihat Web Store
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#f0f9f1] p-1 rounded-2xl border border-pink-100 h-14 w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="hero" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Layout className="h-4 w-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Palette className="h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Zap className="h-4 w-4" />
            Fitur Utama
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Info className="h-4 w-4" />
            Tentang Kami
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-[#ec4899] data-[state=active]:text-white h-full px-6 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Users className="h-4 w-4" />
            Akses Pengguna
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <WebDashboard />
        </TabsContent>

        <TabsContent value="hero">
          <HeroForm initialData={cms?.hero} onSave={(data) => updateMutation.mutate({ section_id: 'hero', content: data })} isSaving={updateMutation.isPending} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesForm initialData={cms?.settings} onSave={(data) => updateMutation.mutate({ section_id: 'settings', content: data })} isSaving={updateMutation.isPending} />
        </TabsContent>

        <TabsContent value="features">
          <FeaturesForm initialData={cms?.features} onSave={(data) => updateMutation.mutate({ section_id: 'features', content: data })} isSaving={updateMutation.isPending} />
        </TabsContent>

        <TabsContent value="about">
          <AboutForm initialData={cms?.about} onSave={(data) => updateMutation.mutate({ section_id: 'about', content: data })} isSaving={updateMutation.isPending} />
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#ec4899] text-white">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Manajemen Akses Web</CardTitle>
              <CardDescription className="text-pink-100">Atur pengguna khusus yang hanya bisa mengelola tampilan web store.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <WebUserManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WebDashboard() {
  const { data: products } = useQuery({ queryKey: ['products-count'], queryFn: async () => supabase.from('products').select('id', { count: 'exact' }) });
  const { data: categories } = useQuery({ queryKey: ['categories-count'], queryFn: async () => supabase.from('categories').select('id', { count: 'exact' }) });
  const { data: webUsers } = useQuery({ queryKey: ['web-users-count'], queryFn: async () => supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'web_admin') });
  const { data: visits } = useQuery({ queryKey: ['visits-count'], queryFn: async () => supabase.from('web_visits').select('id', { count: 'exact' }) });

  const stats = [
    { label: 'Total Pengunjung', value: (visits?.count || 0).toLocaleString(), icon: '👥', color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Total Produk', value: products?.count || 0, icon: '🍰', color: 'bg-pink-100 text-[#ec4899]' },
    { label: 'Kategori', value: categories?.count || 0, icon: '🏷️', color: 'bg-[#f0f9f1] text-emerald-600' },
    { label: 'Status Web', value: 'ONLINE', icon: '🌐', color: 'bg-pink-100 text-[#ec4899]' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} className="border-pink-100 bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-2xl drop-shadow-md group-hover:scale-110 transition-transform", s.color)}>
                  {s.icon}
                </div>
                <div className="h-6 w-6 rounded-full bg-[#f0f9f1] flex items-center justify-center">
                   <ArrowRight className="h-3 w-3 text-[#ec4899]/30" />
                </div>
              </div>
              <h3 className="text-[10px] font-black text-[#5d4037]/40 uppercase tracking-widest">{s.label}</h3>
              <p className="text-3xl font-black text-[#5d4037] tracking-tighter mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-pink-100 bg-white rounded-[2rem] overflow-hidden shadow-sm">
          <CardHeader className="bg-[#ec4899]/5 border-b border-pink-100/50">
            <CardTitle className="text-sm font-black text-[#5d4037] uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#ec4899]" /> Performa Katalog
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-[#f0f9f1] flex items-center justify-center text-4xl drop-shadow-xl animate-bounce-slow">
                   📊
                </div>
                <div>
                   <h4 className="text-lg font-bold text-[#5d4037]">Statistik Penjualan Web</h4>
                   <p className="text-sm text-[#5d4037]/60 max-w-xs mx-auto">Pantau menu yang paling banyak dilihat dan dipesan pelanggan melalui Web Store Anda.</p>
                </div>
                <Button variant="outline" className="rounded-xl border-pink-100 text-[#ec4899] font-bold uppercase text-[10px] tracking-widest">
                   Lihat Detail Katalog
                </Button>
             </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="border-pink-100 bg-[#ec4899] rounded-[2rem] overflow-hidden shadow-lg shadow-pink-100">
              <CardContent className="p-6 text-white space-y-4">
                 <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                    ✨
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight leading-tight">Tingkatkan Tampilan Toko</h3>
                 <p className="text-pink-100 text-xs font-medium">Gunakan foto produk berkualitas tinggi untuk menarik lebih banyak pelanggan.</p>
                 <Button className="w-full bg-white text-[#ec4899] hover:bg-pink-50 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                    Edit Hero Section
                 </Button>
              </CardContent>
           </Card>

           <Card className="border-pink-100 bg-white rounded-[2rem] overflow-hidden shadow-sm">
              <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest">Link Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 {[
                   { label: 'Tambah Produk', icon: '🍰' },
                   { label: 'Ganti Template', icon: '🎨' },
                   { label: 'Lihat Web', icon: '🌐' }
                 ].map((link, i) => (
                   <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#f0f9f1] transition-colors group">
                      <div className="flex items-center gap-3">
                         <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
                         <span className="text-xs font-bold text-[#5d4037]">{link.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#ec4899] opacity-0 group-hover:opacity-100 transition-all" />
                   </button>
                 ))}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function HeroForm({ initialData, onSave, isSaving }: { initialData?: LandingHero, onSave: (data: LandingHero) => void, isSaving: boolean }) {
  const [data, setData] = useState<LandingHero>(initialData || {
    title: "",
    subtitle: "",
    image_url: "",
    images: [],
    cta_text: "",
    secondary_cta_text: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(filePath);
      
      const newImages = [...(data.images || []), publicUrl];
      setData({ ...data, images: newImages, image_url: publicUrl }); // Keep image_url for fallback
      toast.success('Gambar berhasil ditambahkan!');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    setData({ ...data, images: newImages });
  };

  return (
    <Card className="border-pink-100 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-[#ec4899] text-white">
        <CardTitle className="text-xl font-black uppercase tracking-tight">Hero Section</CardTitle>
        <CardDescription className="text-pink-100">Area utama di bagian atas website Anda.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title" className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Judul Utama</Label>
              <Input 
                id="hero-title" 
                value={data.title} 
                onChange={(e) => setData({ ...data, title: e.target.value })} 
                className="rounded-xl bg-white border-pink-100 h-12 font-bold text-[#5d4037]"
                placeholder="Contoh: Roti Manis Setiap Hari"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle" className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Sub Judul</Label>
              <Textarea 
                id="hero-subtitle" 
                value={data.subtitle} 
                onChange={(e) => setData({ ...data, subtitle: e.target.value })} 
                className="rounded-xl bg-white border-pink-100 min-h-[100px] text-[#5d4037]"
                placeholder="Deskripsi singkat toko Anda..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="hero-cta" className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Teks Tombol Utama</Label>
                 <Input 
                   id="hero-cta" 
                   value={data.cta_text} 
                   onChange={(e) => setData({ ...data, cta_text: e.target.value })} 
                   className="rounded-xl bg-white border-pink-100 h-12 text-[#5d4037]"
                   placeholder="Contoh: Pesan Sekarang"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="hero-secondary-cta" className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Teks Tombol Sekunder</Label>
                 <Input 
                   id="hero-secondary-cta" 
                   value={data.secondary_cta_text} 
                   onChange={(e) => setData({ ...data, secondary_cta_text: e.target.value })} 
                   className="rounded-xl bg-white border-pink-100 h-12 text-[#5d4037]"
                   placeholder="Contoh: Tentang Kami"
                 />
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Gambar Hero (Slider)</Label>
               <Button 
                  onClick={() => document.getElementById('hero-upload')?.click()}
                  className="rounded-lg h-9 bg-[#ec4899] gap-2 font-bold uppercase text-[10px] tracking-widest"
                  disabled={isUploading}
               >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tambah Gambar
               </Button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {data.images && data.images.length > 0 ? (
                  data.images.map((img, i) => (
                    <div key={i} className="relative group aspect-video rounded-2xl overflow-hidden border border-pink-100 shadow-sm">
                       <img src={img} alt={`Slide ${i}`} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => removeImage(i)}
                            className="h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                             <Trash2 className="h-5 w-5" />
                          </button>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 rounded-2xl border-2 border-dashed border-pink-100 bg-[#f0f9f1] flex flex-col items-center justify-center">
                     <p className="text-[10px] font-black text-[#5d4037]/40 uppercase tracking-widest">Belum ada gambar slider</p>
                  </div>
                )}
             </div>
             <input 
               id="hero-upload" 
               type="file" 
               className="hidden" 
               accept="image/*"
               onChange={handleFileUpload}
               disabled={isUploading}
             />
             <p className="text-[10px] font-bold text-[#5d4037]/60 italic">*Urutan gambar di sini akan menjadi urutan slide pada web.</p>
          </div>
        </div>
        <div className="pt-6 border-t border-pink-100 flex justify-end">
          <Button onClick={() => onSave(data)} disabled={isSaving || isUploading} className="rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white px-8 h-12 gap-2 shadow-lg shadow-pink-100">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            SIMPAN HERO SECTION
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturesForm({ initialData, onSave, isSaving }: { initialData?: LandingFeature[], onSave: (data: LandingFeature[]) => void, isSaving: boolean }) {
  const [features, setFeatures] = useState<LandingFeature[]>(initialData || []);

  const addFeature = () => {
    setFeatures([...features, { icon: 'Zap', title: 'Fitur Baru', description: 'Deskripsi fitur baru.' }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, updated: LandingFeature) => {
    const newFeatures = [...features];
    newFeatures[index] = updated;
    setFeatures(newFeatures);
  };

  return (
    <Card className="border-pink-100 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-[#ec4899] text-white flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">Fitur Utama</CardTitle>
          <CardDescription className="text-pink-100">Keunggulan layanan yang Anda tawarkan.</CardDescription>
        </div>
        <Button onClick={addFeature} variant="outline" className="rounded-xl border-white text-white hover:bg-white/10 gap-2">
          <Plus className="h-4 w-4" />
          TAMBAH FITUR
        </Button>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-3xl border border-pink-100 bg-[#f0f9f1] relative group">
              <button 
                onClick={() => removeFeature(i)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Ikon (Lucide Name)</Label>
                    <Input 
                      value={f.icon} 
                      onChange={(e) => updateFeature(i, { ...f, icon: e.target.value })} 
                      className="rounded-xl bg-white border-pink-100 h-10 text-[#5d4037]"
                      placeholder="Zap, BarChart3, Smartphone..."
                    />
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-[#ec4899] flex items-center justify-center text-white mt-6 shadow-lg shadow-pink-100">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Judul Fitur</Label>
                  <Input 
                    value={f.title} 
                    onChange={(e) => updateFeature(i, { ...f, title: e.target.value })} 
                    className="rounded-xl bg-white border-pink-100 h-10 font-bold text-[#5d4037]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Deskripsi</Label>
                  <Textarea 
                    value={f.description} 
                    onChange={(e) => updateFeature(i, { ...f, description: e.target.value })} 
                    className="rounded-xl bg-white border-pink-100 min-h-[80px] text-[#5d4037]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-pink-100 flex justify-end">
          <Button onClick={() => onSave(features)} disabled={isSaving} className="rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white px-8 h-12 gap-2 shadow-lg shadow-pink-100">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            SIMPAN FITUR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatesForm({ initialData, onSave, isSaving }: { initialData?: any, onSave: (data: any) => void, isSaving: boolean }) {
  const [activeTemplate, setActiveTemplate] = useState(initialData?.active_template || 'default');
  const [webLogoUrl, setWebLogoUrl] = useState(initialData?.web_logo_url || '');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData?.active_template) setActiveTemplate(initialData.active_template);
    if (initialData?.web_logo_url) setWebLogoUrl(initialData.web_logo_url);
  }, [initialData]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `web-logo-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(filePath);

      setWebLogoUrl(publicUrl);
      toast.success('Logo web berhasil diunggah!');
    } catch (error: any) {
      toast.error('Gagal mengunggah logo', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const templates = [
    { 
      id: 'default', 
      name: 'Strawberry Pink', 
      desc: 'Elegant pink theme with soft white gradients.',
      color: 'bg-pink-500',
      preview: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'wood', 
      name: 'Classic Wood', 
      desc: 'Warm brown tones for a cozy coffee shop feel.',
      color: 'bg-[#3d2b1f]',
      preview: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'minimal', 
      name: 'Clean Minimalist', 
      desc: 'Light, bright and focused on the products.',
      color: 'bg-white',
      preview: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&q=80&w=300'
    },
    { 
      id: 'bakery', 
      name: 'Sweet Bakery', 
      desc: 'Pink & Pastel Green theme for cake and bakery shops.',
      color: 'bg-[#f0f9f1]',
      preview: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=300'
    }
  ];

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cms, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `webstore-template-${activeTemplate}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Template berhasil diekspor');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Batch update all sections
        const promises = Object.entries(json).map(([section_id, content]) => 
          supabase.from('landing_cms').upsert({ section_id, content, updated_at: new Date().toISOString() }, { onConflict: 'section_id' })
        );

        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ['landing_cms'] });
        toast.success('Template berhasil diimpor! Halaman akan memuat ulang.');
      } catch (err) {
        toast.error('Gagal mengimpor file: Format JSON tidak valid');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="border-pink-100 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-[#ec4899] text-white flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-black uppercase tracking-tight">Template Toko</CardTitle>
          <CardDescription className="text-pink-100">Pilih gaya visual atau upload file template kustom Anda.</CardDescription>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="outline" 
            onClick={() => document.getElementById('import-input')?.click()}
            className="rounded-xl border-white text-white hover:bg-white/10 gap-2 h-11"
          >
            <Plus className="h-4 w-4" />
            UPLOAD TEMPLATE
            <input 
              id="import-input" 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImport} 
            />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleExport}
            className="rounded-xl h-11 gap-2 text-pink-100 hover:text-white"
          >
            Ekspor
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="space-y-6">
           <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Logo Khusus Web (Hanya Landing Page)</Label>
           <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-[2rem] border border-pink-100 bg-[#f0f9f1]/30">
              <div className="h-32 w-32 rounded-[2rem] bg-white flex items-center justify-center p-2 shadow-lg border border-pink-100 overflow-hidden shrink-0">
                 {webLogoUrl ? (
                   <img src={webLogoUrl} className="h-full w-full object-contain" alt="Web Logo" />
                 ) : (
                   <div className="text-4xl">🏷️</div>
                 )}
              </div>
              <div className="space-y-4 flex-1">
                 <p className="text-sm font-medium text-[#5d4037]/60">Gunakan logo khusus untuk tampilan Web Store Anda. Ini tidak akan mengganti logo pada sistem POS atau struk.</p>
                 <div className="flex gap-2">
                    <Button 
                      onClick={() => document.getElementById('web-logo-upload')?.click()}
                      className="rounded-xl bg-[#ec4899] h-11 px-6 gap-2 font-bold uppercase text-[10px] tracking-widest"
                      disabled={isUploading}
                    >
                       {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                       Unggah Logo Baru
                    </Button>
                    <input id="web-logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    {webLogoUrl && (
                      <Button variant="outline" onClick={() => setWebLogoUrl('')} className="rounded-xl border-pink-100 h-11 px-6 text-rose-500 font-bold uppercase text-[10px] tracking-widest">Hapus</Button>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div 
              key={tpl.id}
              onClick={() => setActiveTemplate(tpl.id)}
              className={cn(
                "cursor-pointer rounded-3xl border-2 p-1 transition-all",
                activeTemplate === tpl.id ? "border-[#ec4899] scale-[1.02] shadow-xl" : "border-transparent hover:border-pink-50"
              )}
            >
              <div className="rounded-2xl overflow-hidden aspect-[4/3] relative">
                <img src={tpl.preview} className="w-full h-full object-cover" />
                <div className={cn("absolute inset-0 opacity-20", tpl.color)} />
                {activeTemplate === tpl.id && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-[#ec4899] text-white flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-sm uppercase tracking-tight text-[#5d4037]">{tpl.name}</h4>
                <p className="text-[10px] text-[#5d4037]/60 font-medium">{tpl.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-pink-100 flex justify-end">
          <Button onClick={() => onSave({ active_template: activeTemplate, web_logo_url: webLogoUrl })} disabled={isSaving || isUploading} className="rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white px-8 h-12 gap-2 shadow-lg shadow-pink-100">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            TERAPKAN PENGATURAN
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutForm({ initialData, onSave, isSaving }: { initialData?: LandingAbout, onSave: (data: LandingAbout) => void, isSaving: boolean }) {
  const [data, setData] = useState<LandingAbout>(initialData || {
    badge: "",
    title: "",
    description: "",
    items: []
  });

  const addItem = () => {
    setData({ ...data, items: [...data.items, { icon: 'Coffee', text: 'Nama Bisnis' }] });
  };

  const removeItem = (index: number) => {
    setData({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, text: string) => {
    const newItems = [...data.items];
    newItems[index].text = text;
    setData({ ...data, items: newItems });
  };

  return (
    <Card className="border-pink-100 shadow-sm rounded-3xl overflow-hidden">
      <CardHeader className="bg-[#ec4899] text-white">
        <CardTitle className="text-xl font-black uppercase tracking-tight">Tentang Kami</CardTitle>
        <CardDescription className="text-pink-100">Informasi detail mengenai bisnis Anda.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Badge Text</Label>
              <Input 
                value={data.badge} 
                onChange={(e) => setData({ ...data, badge: e.target.value })} 
                className="rounded-xl bg-white border-pink-100 h-12 text-[#5d4037]"
                placeholder="Contoh: Multiguna"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Judul Utama Seksi</Label>
              <Input 
                value={data.title} 
                onChange={(e) => setData({ ...data, title: e.target.value })} 
                className="rounded-xl bg-white border-pink-100 h-12 font-bold text-[#5d4037]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Deskripsi Panjang</Label>
            <Textarea 
              value={data.description} 
              onChange={(e) => setData({ ...data, description: e.target.value })} 
              className="rounded-xl bg-white border-pink-100 min-h-[120px] text-[#5d4037]"
            />
          </div>
          
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-[10px] uppercase tracking-widest text-[#ec4899]">Daftar Poin (Layanan)</Label>
              <Button onClick={addItem} size="sm" variant="outline" className="rounded-lg gap-2 text-[10px] font-black uppercase tracking-widest">
                <Plus className="h-3 w-3" /> Tambah Poin
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center bg-[#f0f9f1] p-2 rounded-xl border border-pink-100 group">
                  <Input 
                    value={item.text} 
                    onChange={(e) => updateItem(i, e.target.value)} 
                    className="flex-1 h-9 rounded-lg border-none bg-transparent font-bold text-sm"
                  />
                  <button onClick={() => removeItem(i)} className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-pink-100 flex justify-end">
          <Button onClick={() => onSave(data)} disabled={isSaving} className="rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white px-8 h-12 gap-2 shadow-lg shadow-pink-100">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            SIMPAN TENTANG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

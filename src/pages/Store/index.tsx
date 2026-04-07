import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Store, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  MapPin, 
  Phone, 
  Building2,
  Settings2,
  Save,
  Clock,
  MessageSquare,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StoreManagement() {
  const [activeTab, setActiveTab] = useState('identity');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const queryClient = useQueryClient();

  // 1. Fetch Global Store Identity (store_configs)
  const { data: config, isLoading: isLoadingConfig, refetch } = useQuery({
    queryKey: ['store_config_global'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('store_configs')
        .select('*')
        .is('branch_id', null) // Selalu ambil konfigurasi global
        .order('created_at', { ascending: false }) // Ambil yang paling baru
        .limit(1)
        .maybeSingle();
      
      if (error) {
          console.error("Fetch store_config error:", error);
          throw error;
      }
      
      return data || { 
          store_name: 'WUDkopi',
          store_address: '',
          store_phone: '',
          open_time: '08:00',
          close_time: '22:00',
          footer_message: 'Terima kasih atas kunjungan Anda!',
          settings: { showTable: true, showRecall: true, showGuest: true, showManual: true }
      };
    }
  });

  useEffect(() => {
    // Initial load: sync fetched config to local state
    if (config && !storeConfig) {
        setStoreConfig(config);
    }
    // After save/mutation: ensure we have the ID to avoid duplicate row inserts on next save
    if (config?.id && storeConfig && !storeConfig.id) {
        setStoreConfig(prev => ({ ...prev, id: config.id }));
    }
  }, [config, storeConfig]);

  // 2. Fetch Branches
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches_management'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('branches')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Mutasi Identitas
  const configMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { created_at, updated_at, ...cleanData } = newData;
      if (cleanData.branch_id === "") cleanData.branch_id = null;
      
      console.log("Upserting store_config:", cleanData);
      
      const query = (supabase as any).from('store_configs');
      const { data, error } = cleanData.id 
        ? await query.upsert(cleanData, { onConflict: 'id' }).select().single()
        : await query.insert([cleanData]).select().single();
        
      if (error) {
          console.error("Upsert error details:", error);
          throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['store_config_global'], data);
      setStoreConfig(data);
      toast.success('Identitas toko berhasil disimpan');
    },
    onError: (err: any) => {
        console.error("Save store_config error:", err);
        toast.error('Gagal simpan identitas', { description: err.message });
    }
  });

  // Mutasi Cabang
  const branchMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingBranch) {
        const { error } = await (supabase as any)
          .from('branches')
          .update(data)
          .eq('id', editingBranch.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('branches')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches_management'] });
      setIsAddOpen(false);
      setEditingBranch(null);
      resetForm();
      toast.success(editingBranch ? 'Data cabang diperbarui' : 'Cabang ditambahkan');
    }
  });

  const deleteBranchSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches_management'] })
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File terlalu besar', { description: 'Maksimal ukuran file adalah 2MB' });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. First ensure bucket exists or handle bucket not found gracefully
      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(filePath, file, { 
            cacheControl: '3600',
            upsert: false 
        });

      if (uploadError) {
          if (uploadError.message.includes('bucket not found')) {
              throw new Error("Penyimpanan logo belum aktif di server. Silakan hubungi admin atau jalankan migrasi SQL yang tersedia.");
          }
          throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(filePath);

      // Create a fresh config object to avoid state race conditions
      const updatedConfig = { ...storeConfig, logo_url: publicUrl };
      setStoreConfig(updatedConfig);
      
      // Auto save the config with new logo immediately
      await configMutation.mutateAsync(updatedConfig);
      
    } catch (error: any) {
      console.error("Logo upload error details:", error);
      toast.error('Gagal memproses logo', { 
          description: error.message || 'Pastikan kolom "logo_url" sudah ada di database.'
      });
    }
  };

  const removeLogo = () => {
    const updatedConfig = { ...storeConfig, logo_url: null };
    setStoreConfig(updatedConfig);
    configMutation.mutate(updatedConfig);
  };

  const resetForm = () => setFormData({ name: '', address: '', phone: '' });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kelola Toko & Cabang</h1>
        <p className="text-muted-foreground mt-1">Konfigurasi pusat outlet, identitas bisnis, dan daftar cabang Anda.</p>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-2xl h-12 max-w-[400px]">
          <TabsTrigger value="identity" className="rounded-xl font-bold data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <Store className="h-4 w-4 mr-2" /> Identitas Utama
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-xl font-bold data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
            <Building2 className="h-4 w-4 mr-2" /> Daftar Cabang
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Identitas Utama Toko */}
        <TabsContent value="identity" className="mt-8">
          <div className="max-w-4xl grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-primary/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" /> Informasi Bisnis
                  </CardTitle>
                  <CardDescription>Informasi yang akan muncul pada struk dan laporan global.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {isLoadingConfig || !storeConfig ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      {/* Logo Upload Section */}
                      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-secondary/30 border border-dashed border-border mb-4">
                        <div className="relative group">
                          <div className="h-24 w-24 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden pos-shadow">
                            {storeConfig.logo_url ? (
                              <img 
                                src={storeConfig.logo_url} 
                                alt="Logo Toko" 
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          {storeConfig.logo_url && (
                            <button 
                              onClick={removeLogo}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold">
                              <Upload className="h-4 w-4" />
                              {storeConfig.logo_url ? 'Ganti Logo' : 'Unggah Logo Toko'}
                            </div>
                            <input 
                              id="logo-upload" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </Label>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Format PNG/JPG, Maks 2MB</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Bisnis / Toko Utama</Label>
                        <Input 
                          value={storeConfig.store_name} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_name: e.target.value})}
                          className="bg-secondary/50 rounded-xl border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Alamat Pusat</Label>
                        <Input 
                          value={storeConfig.store_address} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_address: e.target.value})}
                          className="bg-secondary/50 rounded-xl border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp / Telp Pusat</Label>
                        <Input 
                          value={storeConfig.store_phone} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_phone: e.target.value})}
                          className="bg-secondary/50 rounded-xl border-border"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-purple-500/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" /> Jam Operasional
                  </CardTitle>
                  <CardDescription>Jadwal operasional toko untuk pelaporan shift.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  {!storeConfig ? <Loader2 className="animate-spin" /> : (
                    <>
                      <div className="space-y-2">
                        <Label>Jam Buka</Label>
                        <Input 
                          type="time"
                          value={storeConfig.open_time} 
                          onChange={(e) => setStoreConfig({...storeConfig, open_time: e.target.value})}
                          className="bg-secondary/50 rounded-xl border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jam Tutup</Label>
                        <Input 
                          type="time"
                          value={storeConfig.close_time} 
                          onChange={(e) => setStoreConfig({...storeConfig, close_time: e.target.value})}
                          className="bg-secondary/50 rounded-xl border-border"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-orange-500/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-500" /> Pesan Penutup (Footer Struk)
                  </CardTitle>
                  <CardDescription>Pesan yang akan dicetak di akhir struk pembayaran.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {!storeConfig ? <Loader2 className="animate-spin" /> : (
                    <textarea 
                      value={storeConfig.footer_message} 
                      onChange={(e) => setStoreConfig({...storeConfig, footer_message: e.target.value})}
                      className="w-full p-4 rounded-2xl bg-secondary/50 border border-border text-sm min-h-[140px] focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Terima kasih telah berbelanja..."
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end p-2">
                <Button 
                   onClick={() => configMutation.mutate(storeConfig)} 
                   className="gradient-primary text-primary-foreground font-black rounded-2xl pos-shadow h-14 px-10 gap-3"
                   disabled={configMutation.isPending}
                >
                  {configMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  SIMPAN PERUBAHAN IDENTITAS
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Daftar Cabang/Outlet */}
        <TabsContent value="branches" className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="h-5 w-5" /> Daftar Outlet Terdaftar</h2>
            <Dialog open={isAddOpen || !!editingBranch} onOpenChange={(open) => {
              if (!open) {
                setIsAddOpen(false);
                setEditingBranch(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddOpen(true)} className="gradient-primary text-primary-foreground font-semibold rounded-2xl pos-shadow">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Cabang
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>{editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}</DialogTitle>
                  <DialogDescription>Informasi outlet atau unit bisnis baru.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); branchMutation.mutate(formData); }} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Cabang</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-secondary rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className="bg-secondary rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-secondary rounded-xl" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full gradient-primary" disabled={branchMutation.isPending}>
                       {branchMutation.isPending ? <Loader2 className="animate-spin" /> : 'Simpan Data Cabang'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingBranches ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-3xl" />)
            ) : branches.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-card border border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground">Belum ada cabang terdaftar.</p>
                </div>
            ) : branches.map((branch: any) => (
              <div key={branch.id} className="relative bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-2">
                     <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                        setEditingBranch(branch);
                        setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
                     }}><Edit2 className="h-4 w-4" /></Button>
                     <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                        if (confirm('Hapus cabang ini?')) deleteBranchSub.mutate(branch.id);
                     }}><Trash2 className="h-4 w-4" /></Button>
                   </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Building2 className="h-6 w-6 text-primary" /></div>
                <h3 className="text-xl font-black text-foreground mb-4">{branch.name}</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /><p className="line-clamp-2">{branch.address || '-'}</p></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><p>{branch.phone || '-'}</p></div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

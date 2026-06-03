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
  Image as ImageIcon,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          transaction_id_mode: 'auto',
          transaction_prefix: 'TRX',
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
        <h1 className="text-3xl font-black text-[#5d4037] uppercase tracking-tight">Kelola Toko & Cabang</h1>
        <p className="text-[#ec4899] mt-1 font-bold text-xs uppercase tracking-widest">Konfigurasi pusat outlet, identitas bisnis, dan daftar cabang Anda.</p>
      </div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#f0f9f1] p-1 rounded-2xl h-12 max-w-[400px] border border-pink-100">
          <TabsTrigger value="identity" className="rounded-xl font-bold data-[state=active]:bg-[#ec4899] data-[state=active]:text-white text-[#5d4037]/60">
            <Store className="h-4 w-4 mr-2" /> Identitas Utama
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-xl font-bold data-[state=active]:bg-[#ec4899] data-[state=active]:text-white text-[#5d4037]/60">
            <Building2 className="h-4 w-4 mr-2" /> Daftar Cabang
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Identitas Utama Toko */}
        <TabsContent value="identity" className="mt-8">
          <div className="max-w-4xl grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#ec4899]/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                    <Store className="h-5 w-5 text-[#ec4899]" /> Informasi Bisnis
                  </CardTitle>
                  <CardDescription className="text-[#5d4037]/60">Informasi yang akan muncul pada struk dan laporan global.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {isLoadingConfig || !storeConfig ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      {/* Logo Upload Section */}
                      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#f0f9f1]/30 border border-dashed border-pink-100 mb-4">
                        <div className="relative group">
                          <div className="h-24 w-24 rounded-2xl bg-white border border-pink-100 flex items-center justify-center overflow-hidden pos-shadow">
                            {storeConfig.logo_url ? (
                              <img 
                                src={storeConfig.logo_url} 
                                alt="Logo Toko" 
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-[#5d4037]/20" />
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-100 text-[#ec4899] hover:bg-pink-200 transition-colors text-sm font-bold">
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
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Nama Bisnis / Toko Utama</Label>
                        <Input 
                          value={storeConfig.store_name} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_name: e.target.value})}
                          className="bg-white rounded-xl border-pink-100 text-[#5d4037] font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Alamat Pusat</Label>
                        <Input 
                          value={storeConfig.store_address} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_address: e.target.value})}
                          className="bg-white rounded-xl border-pink-100 text-[#5d4037]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">WhatsApp / Telp Pusat</Label>
                        <Input 
                          value={storeConfig.store_phone} 
                          onChange={(e) => setStoreConfig({...storeConfig, store_phone: e.target.value})}
                          className="bg-white rounded-xl border-pink-100 text-[#5d4037]"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#ec4899]/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                    <Clock className="h-5 w-5 text-[#ec4899]" /> Jam Operasional
                  </CardTitle>
                  <CardDescription className="text-[#5d4037]/60">Jadwal operasional toko untuk pelaporan shift.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  {!storeConfig ? <Loader2 className="animate-spin" /> : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Jam Buka</Label>
                        <Input 
                          type="time"
                          value={storeConfig.open_time} 
                          onChange={(e) => setStoreConfig({...storeConfig, open_time: e.target.value})}
                          className="bg-white rounded-xl border-pink-100 text-[#5d4037] font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Jam Tutup</Label>
                        <Input 
                          type="time"
                          value={storeConfig.close_time} 
                          onChange={(e) => setStoreConfig({...storeConfig, close_time: e.target.value})}
                          className="bg-white rounded-xl border-pink-100 text-[#5d4037] font-bold"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#ec4899]/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                    <Hash className="h-5 w-5 text-[#ec4899]" /> Pengaturan Nomor Transaksi (ID)
                  </CardTitle>
                  <CardDescription className="text-[#5d4037]/60">Atur bagaimana nomor struk/transaksi dibuat.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {!storeConfig ? <Loader2 className="animate-spin" /> : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Mode Penomoran</Label>
                        <Select 
                          value={storeConfig.transaction_id_mode || 'auto'} 
                          onValueChange={(val) => setStoreConfig({...storeConfig, transaction_id_mode: val})}
                        >
                          <SelectTrigger className="bg-white rounded-xl border-pink-100 text-[#5d4037] font-bold">
                            <SelectValue placeholder="Pilih Mode" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-pink-100 bg-white">
                            <SelectItem value="auto" className="font-bold text-[#5d4037]">Otomatis (Sistem)</SelectItem>
                            <SelectItem value="manual" className="font-bold text-[#5d4037]">Manual (Input Kasir)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-[#ec4899] uppercase font-bold px-1">
                          {storeConfig.transaction_id_mode === 'manual' 
                            ? "* KASIR WAJIB INPUT NOMOR STRUK SAAT PEMBAYARAN" 
                            : "* SISTEM AKAN GENERATE NOMOR STRUK OTOMATIS"}
                        </p>
                      </div>

                      {storeConfig.transaction_id_mode !== 'manual' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Prefix ID Transaksi (Otomatis)</Label>
                          <Input 
                            value={storeConfig.transaction_prefix || 'TRX'} 
                            onChange={(e) => setStoreConfig({...storeConfig, transaction_prefix: e.target.value.toUpperCase()})}
                            placeholder="Contoh: TRX, INV, WUD"
                            className="bg-white rounded-xl border-pink-100 font-mono font-black text-[#5d4037]"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Contoh ID: <span className="text-foreground font-bold font-mono">{storeConfig.transaction_prefix || 'TRX'}-20240101-ABCD</span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#ec4899]/5 pb-6">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                    <MessageSquare className="h-5 w-5 text-[#ec4899]" /> Pesan Penutup (Footer Struk)
                  </CardTitle>
                  <CardDescription className="text-[#5d4037]/60">Pesan yang akan dicetak di akhir struk pembayaran.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {!storeConfig ? <Loader2 className="animate-spin" /> : (
                    <textarea 
                      value={storeConfig.footer_message} 
                      onChange={(e) => setStoreConfig({...storeConfig, footer_message: e.target.value})}
                      className="w-full p-4 rounded-2xl bg-white border border-pink-100 text-sm min-h-[140px] focus:outline-none focus:ring-1 focus:ring-[#ec4899] text-[#5d4037] font-medium"
                      placeholder="Terima kasih telah berbelanja..."
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end p-2">
                <Button 
                   onClick={() => configMutation.mutate(storeConfig)} 
                   className="bg-[#ec4899] hover:bg-[#db2777] text-white font-black rounded-2xl shadow-lg shadow-pink-100 h-14 px-10 gap-3"
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
                <Button onClick={() => setIsAddOpen(true)} className="bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold rounded-2xl shadow-lg shadow-pink-100">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Cabang
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white border-pink-100">
                <DialogHeader>
                  <DialogTitle className="text-[#5d4037] font-black uppercase tracking-tight">
                    {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Informasi outlet atau unit bisnis baru.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); branchMutation.mutate(formData); }} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#5d4037] font-bold text-[10px] uppercase tracking-widest">Nama Cabang</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="bg-white border-pink-100 rounded-xl text-[#5d4037] font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[#5d4037] font-bold text-[10px] uppercase tracking-widest">Alamat</Label>
                    <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required className="bg-white border-pink-100 rounded-xl text-[#5d4037]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#5d4037] font-bold text-[10px] uppercase tracking-widest">Telepon</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-white border-pink-100 rounded-xl text-[#5d4037]" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full bg-[#ec4899] hover:bg-[#db2777] text-white rounded-xl h-11" disabled={branchMutation.isPending}>
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
                <div className="col-span-full py-12 text-center bg-white border border-dashed border-pink-100 rounded-3xl">
                    <p className="text-[#5d4037] opacity-40 font-bold">Belum ada cabang terdaftar.</p>
                </div>
            ) : branches.map((branch: any) => (
              <div key={branch.id} className="relative bg-white border border-pink-100 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all group overflow-hidden">
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
                <div className="h-12 w-12 rounded-2xl bg-pink-100 flex items-center justify-center mb-4"><Building2 className="h-6 w-6 text-[#ec4899]" /></div>
                <h3 className="text-xl font-black text-[#5d4037] mb-4 uppercase tracking-tighter">{branch.name}</h3>
                <div className="space-y-3 text-sm text-[#5d4037]/60 font-medium">
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-[#ec4899]" /><p className="line-clamp-2">{branch.address || '-'}</p></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#ec4899]" /><p>{branch.phone || '-'}</p></div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

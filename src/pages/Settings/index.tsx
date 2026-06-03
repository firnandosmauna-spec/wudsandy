import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Settings, 
  Printer, 
  CreditCard, 
  Layout, 
  Save, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  // Fetch Current Settings
  const { data: config, isLoading } = useQuery({
    queryKey: ['store_config_global'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('store_configs')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) {
          console.error("Fetch store_config error:", error);
          throw error;
      }
      
      return data || { 
          auto_print: false,
          enable_qris: true,
          enable_transfer: true,
          show_table_number: true,
          show_customer_name: true,
          paper_size: '58mm',
          settings: { showTable: true, showRecall: true, showGuest: true, showManual: true }
      };
    }
  });

  useEffect(() => {
    if (config && !formData) {
      setFormData(config);
    }
  }, [config, formData]);

  // Update Mutation
  const mutation = useMutation({
    mutationFn: async (newData: any) => {
      const { created_at, updated_at, ...cleanData } = newData;
      if (cleanData.branch_id === "") cleanData.branch_id = null;
      
      const { data, error } = await (supabase as any)
        .from('store_configs')
        .upsert(cleanData, { onConflict: 'id' })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['store_config_global'], data);
      setFormData(data);
      toast.success('Konfigurasi sistem berhasil disimpan');
    },
    onError: (error: any) => {
      console.error("Save system config error:", error);
      toast.error('Gagal menyimpan konfigurasi', { description: error.message });
    }
  });

  if (isLoading || !formData) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const handleToggle = (key: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#5d4037] uppercase tracking-tight">Pengaturan Sistem</h1>
          <p className="text-[#ec4899] mt-1 font-bold text-xs uppercase tracking-widest">Konfigurasi teknis, preferensi tampilan struk, dan metode pembayaran.</p>
        </div>
        <Button onClick={handleSave} className="bg-[#ec4899] hover:bg-[#db2777] text-white font-bold rounded-xl shadow-lg shadow-pink-100 h-11 px-8" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Konfigurasi
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Hardware & UI Preferences */}
        <div className="space-y-8">
          <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-[#ec4899]/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                <Printer className="h-5 w-5 text-[#ec4899]" /> Konfigurasi Printer
              </CardTitle>
              <CardDescription className="text-[#5d4037]/60">Pengaturan pencetakan struk transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Ukuran Kertas Struk</Label>
                <select 
                  value={formData.paper_size}
                  onChange={(e) => setFormData({...formData, paper_size: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl bg-[#f0f9f1] border border-pink-100 text-sm text-[#5d4037] font-bold"
                >
                  <option value="58mm">58mm (Thermal Standar)</option>
                  <option value="80mm">80mm (Thermal Lebar)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <div className="space-y-0.5">
                    <Label className="text-sm text-[#5d4037] font-bold">Auto Cetak Struk</Label>
                    <p className="text-[10px] text-[#5d4037]/60">Cetak otomatis setelah pembayaran sukses.</p>
                 </div>
                 <Switch checked={formData.auto_print} onCheckedChange={() => handleToggle('auto_print')} className="data-[state=checked]:bg-[#ec4899]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-[#10b981]/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                <CreditCard className="h-5 w-5 text-[#10b981]" /> Metode Pembayaran Aktif
              </CardTitle>
              <CardDescription className="text-[#5d4037]/60">Pilih metode yang tersedia di halaman kasir.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <Label className="text-xs text-[#5d4037] font-bold">QRIS</Label>
                 <Switch checked={formData.enable_qris} onCheckedChange={() => handleToggle('enable_qris')} className="data-[state=checked]:bg-[#10b981]" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <Label className="text-xs text-[#5d4037] font-bold">Transfer Bank</Label>
                 <Switch checked={formData.enable_transfer} onCheckedChange={() => handleToggle('enable_transfer')} className="data-[state=checked]:bg-[#10b981]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UI Preferences */}
        <div className="space-y-8">
           <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-[#3b82f6]/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                <Layout className="h-5 w-5 text-[#3b82f6]" /> Preferensi Tampilan Kasir
              </CardTitle>
              <CardDescription className="text-[#5d4037]/60">Sesuaikan elemen input yang muncul saat transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <div className="space-y-0.5">
                    <Label className="text-sm text-[#5d4037] font-bold">Input Nomor Meja</Label>
                    <p className="text-[10px] text-[#5d4037]/60">Munculkan pilihan meja (untuk Resto/Cafe).</p>
                 </div>
                 <Switch checked={formData.show_table_number} onCheckedChange={() => handleToggle('show_table_number')} className="data-[state=checked]:bg-[#3b82f6]" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <div className="space-y-0.5">
                    <Label className="text-sm text-[#5d4037] font-bold">Input Nama Pelanggan</Label>
                    <p className="text-[10px] text-[#5d4037]/60">Aktifkan pencatatan database pelanggan.</p>
                 </div>
                 <Switch checked={formData.show_customer_name} onCheckedChange={() => handleToggle('show_customer_name')} className="data-[state=checked]:bg-[#3b82f6]" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f0f9f1]/30 border border-pink-100/20">
                 <div className="space-y-0.5">
                    <Label className="text-sm text-[#5d4037] font-bold">Nama Kasir di Struk</Label>
                    <p className="text-[10px] text-[#5d4037]/60">Cetakan nama petugas yang login saat ini.</p>
                 </div>
                 <Switch checked={formData.show_cashier_name} onCheckedChange={() => handleToggle('show_cashier_name')} className="data-[state=checked]:bg-[#3b82f6]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-100 bg-white rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-[#f97316]/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2 text-[#5d4037] font-black uppercase tracking-tight">
                <Settings className="h-5 w-5 text-[#f97316]" /> Pengaturan ID Transaksi
              </CardTitle>
              <CardDescription className="text-[#5d4037]/60">Pilih cara pembuatan nomor kartu/ID transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Mode ID Transaksi</Label>
                <select 
                  value={formData.transaction_id_mode || 'auto'}
                  onChange={(e) => setFormData({...formData, transaction_id_mode: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl bg-[#f0f9f1] border border-pink-100 text-sm text-[#5d4037] font-bold"
                >
                  <option value="auto">Otomatis (Sistem)</option>
                  <option value="manual">Manual (Input Berkas)</option>
                </select>
              </div>
              
              {formData.transaction_id_mode !== 'manual' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Awalan (Prefix) ID</Label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Contoh: TRX, INV, WUD"
                      value={formData.transaction_prefix || ''}
                      onChange={(e) => setFormData({...formData, transaction_prefix: e.target.value.toUpperCase()})}
                      className="flex-1 h-10 px-3 rounded-xl bg-[#f0f9f1] border border-pink-100 text-sm font-black text-[#5d4037]"
                    />
                    <div className="h-10 px-3 flex items-center rounded-xl bg-[#f0f9f1] border border-pink-100 text-[10px] font-mono text-[#5d4037] font-black">
                      Hasil: {formData.transaction_prefix || 'TRX'}-2024...
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

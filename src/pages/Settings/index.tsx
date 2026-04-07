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
          <h1 className="text-3xl font-bold text-foreground">Pengaturan Sistem</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi teknis, preferensi tampilan struk, dan metode pembayaran.</p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-primary-foreground font-bold rounded-xl pos-shadow h-11 px-8" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Konfigurasi
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Hardware & UI Preferences */}
        <div className="space-y-8">
          <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" /> Konfigurasi Printer
              </CardTitle>
              <CardDescription>Pengaturan pencetakan struk transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Ukuran Kertas Struk</Label>
                <select 
                  value={formData.paper_size}
                  onChange={(e) => setFormData({...formData, paper_size: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-sm"
                >
                  <option value="58mm">58mm (Thermal Standar)</option>
                  <option value="80mm">80mm (Thermal Lebar)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <div className="space-y-0.5">
                    <Label className="text-sm">Auto Cetak Struk</Label>
                    <p className="text-[10px] text-muted-foreground">Cetak otomatis setelah pembayaran sukses.</p>
                 </div>
                 <Switch checked={formData.auto_print} onCheckedChange={() => handleToggle('auto_print')} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-emerald-500/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" /> Metode Pembayaran Aktif
              </CardTitle>
              <CardDescription>Pilih metode yang tersedia di halaman kasir.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <Label className="text-xs">QRIS</Label>
                 <Switch checked={formData.enable_qris} onCheckedChange={() => handleToggle('enable_qris')} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <Label className="text-xs">Transfer Bank</Label>
                 <Switch checked={formData.enable_transfer} onCheckedChange={() => handleToggle('enable_transfer')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UI Preferences */}
        <div className="space-y-8">
           <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-blue-500/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-500" /> Preferensi Tampilan Kasir
              </CardTitle>
              <CardDescription>Sesuaikan elemen input yang muncul saat transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <div className="space-y-0.5">
                    <Label className="text-sm">Input Nomor Meja</Label>
                    <p className="text-[10px] text-muted-foreground">Munculkan pilihan meja (untuk Resto/Cafe).</p>
                 </div>
                 <Switch checked={formData.show_table_number} onCheckedChange={() => handleToggle('show_table_number')} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <div className="space-y-0.5">
                    <Label className="text-sm">Input Nama Pelanggan</Label>
                    <p className="text-[10px] text-muted-foreground">Aktifkan pencatatan database pelanggan.</p>
                 </div>
                 <Switch checked={formData.show_customer_name} onCheckedChange={() => handleToggle('show_customer_name')} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                 <div className="space-y-0.5">
                    <Label className="text-sm">Nama Kasir di Struk</Label>
                    <p className="text-[10px] text-muted-foreground">Cetakan nama petugas yang login saat ini.</p>
                 </div>
                 <Switch checked={formData.show_cashier_name} onCheckedChange={() => handleToggle('show_cashier_name')} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-orange-500/5 pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" /> Pengaturan ID Transaksi
              </CardTitle>
              <CardDescription>Pilih cara pembuatan nomor kartu/ID transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Mode ID Transaksi</Label>
                <select 
                  value={formData.transaction_id_mode || 'auto'}
                  onChange={(e) => setFormData({...formData, transaction_id_mode: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-sm"
                >
                  <option value="auto">Otomatis (Sistem)</option>
                  <option value="manual">Manual (Input Berkas)</option>
                </select>
              </div>
              
              {formData.transaction_id_mode !== 'manual' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Awalan (Prefix) ID</Label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Contoh: TRX, INV, WUD"
                      value={formData.transaction_prefix || ''}
                      onChange={(e) => setFormData({...formData, transaction_prefix: e.target.value.toUpperCase()})}
                      className="flex-1 h-10 px-3 rounded-xl bg-secondary/50 border border-border text-sm font-bold"
                    />
                    <div className="h-10 px-3 flex items-center rounded-xl bg-muted text-[10px] font-mono text-muted-foreground">
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

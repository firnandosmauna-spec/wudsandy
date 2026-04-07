import { useState } from 'react';
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
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  Edit2, 
  Loader2, 
  Search, 
  User, 
  Percent, 
  Banknote,
  TrendingUp,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export default function PayrollSettings() {
  const [search, setSearch] = useState('');
  const [editingPayroll, setEditingPayroll] = useState<any>(null);
  const [formData, setFormData] = useState({
    base_salary: '0',
    daily_allowance: '0',
    commission_rate: '0'
  });
  
  const queryClient = useQueryClient();

  // Fetch Profiles with their Payroll Settings
  const { data: staff, isLoading, isError, error } = useQuery({
    queryKey: ['staff_payroll'],
    queryFn: async () => {
      // 1. Fetch Profiles
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // 2. Fetch Payroll Settings separately to avoid join/relation errors
      const { data: payrolls, error: payrollsError } = await (supabase as any)
        .from('payroll_settings')
        .select('*');
      
      // If payroll_settings table doesn't exist yet, we treat it as empty rather than failing
      const safePayrolls = payrolls || [];
      
      // 3. Merge data manually
      const mergedData = profiles.map((profile: any) => ({
        ...profile,
        payroll_settings: safePayrolls.filter((p: any) => p.user_id === profile.id)
      }));

      return mergedData;
    }
  });

  // Upsert Payroll Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await (supabase as any)
        .from('payroll_settings')
        .upsert(data, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_payroll'] });
      setEditingPayroll(null);
      toast.success('Pengaturan gaji berhasil disimpan');
    },
    onError: (error: any) => {
      toast.error('Gagal menyimpan pengaturan gaji', { description: error.message });
    }
  });

  const handleEdit = (profile: any) => {
    const payroll = profile.payroll_settings?.[0] || {};
    setEditingPayroll(profile);
    setFormData({
      base_salary: (payroll.base_salary || 0).toString(),
      daily_allowance: (payroll.daily_allowance || 0).toString(),
      commission_rate: (payroll.commission_rate || 0).toString()
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      user_id: editingPayroll.id,
      base_salary: parseFloat(formData.base_salary),
      daily_allowance: parseFloat(formData.daily_allowance),
      commission_rate: parseFloat(formData.commission_rate)
    });
  };

  const filteredStaff = staff?.filter((s: any) => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-black uppercase tracking-tighter">Pengaturan Gaji</h1>
          <p className="text-muted-foreground mt-1">Kelola gaji pokok, tunjangan rutin, dan komisi penjualan karyawan.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari karyawan..." 
            className="pl-10 bg-background border-border rounded-xl h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border">
              <TableHead className="font-black text-[10px] uppercase tracking-widest px-6 py-5">Karyawan</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest">Jabatan</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-emerald-600">Gaji Pokok</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-blue-600">Tunjangan Harian</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-orange-600">Komisi (%)</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest px-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Memuat data gaji...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="bg-destructive/10 p-6 rounded-2xl max-w-md mx-auto border border-destructive/20">
                    <p className="text-destructive font-bold mb-2 text-sm">Gagal memuat tabel database!</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Tabel <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">payroll_settings</code> tidak ditemukan atau akses ditolak.
                      Pastikan Anda sudah menjalankan query SQL di Supabase Editor.
                    </p>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['staff_payroll'] })}
                    >
                      Coba Segarkan Halaman
                    </Button>
                    <p className="mt-2 text-[10px] text-muted-foreground italic">Error: {(error as any)?.message}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                  Tidak ada data karyawan ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff?.map((profile: any) => {
                const payroll = profile.payroll_settings?.[0] || {};
                return (
                  <TableRow key={profile.id} className="hover:bg-muted/30 transition-colors border-border group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                          {profile.full_name?.[0].toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{profile.full_name || 'Tanpa Nama'}</p>
                          <p className="text-[10px] text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase tracking-tighter bg-secondary px-2 py-1 rounded-lg">
                        {profile.role}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      Rp {(payroll.base_salary || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-bold text-blue-600">
                      Rp {(payroll.daily_allowance || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-bold text-orange-600">
                      {payroll.commission_rate || 0}%
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors h-10 w-10"
                        onClick={() => handleEdit(profile)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingPayroll} onOpenChange={(open) => !open && setEditingPayroll(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border p-0 overflow-hidden rounded-3xl">
          <div className="gradient-primary p-8 text-white">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter">Edit Komponen Gaji</DialogTitle>
                  <p className="text-sm opacity-80 font-medium">{editingPayroll?.full_name}</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gaji Pokok (Bulanan)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
                    className="pl-10 bg-secondary border-border h-12 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tunjangan Harian (Transport/Makan)</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.daily_allowance}
                    onChange={(e) => setFormData({...formData, daily_allowance: e.target.value})}
                    className="pl-10 bg-secondary border-border h-12 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Persentase Komisi Penjualan (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                    className="pl-10 bg-secondary border-border h-12 rounded-xl font-bold"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 italic">Bonus otomatis dihitung dari total transaksi yang dilakukan karyawan.</p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full h-12 gradient-primary text-white font-black rounded-xl shadow-lg pos-shadow gap-2 mt-4"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> SIMPAN PENGATURAN</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

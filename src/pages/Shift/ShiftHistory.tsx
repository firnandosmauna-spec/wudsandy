import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  History, 
  Calendar, 
  User, 
  DollarSign,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ShiftHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedShift, setSelectedShift] = useState<any>(null);

  // Fetch Shift History
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cash_registers')
        .select('*, profiles(full_name)')
        .order('opening_time', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Transactions for a specific shift
  const { data: shiftTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['shift_transactions', selectedShift?.id],
    enabled: !!selectedShift,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*')
        .eq('cash_register_id', selectedShift.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filteredShifts = shifts?.filter(s => {
    const matchesSearch = s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                         s.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const shiftDate = new Date(s.opening_time);
      matchesDate = isWithinInterval(shiftDate, {
        start: startOfDay(new Date(dateFilter)),
        end: endOfDay(new Date(dateFilter))
      });
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate Totals
  const totalSales = filteredShifts?.reduce((sum, s) => sum + Number(s.total_sales || 0), 0) || 0;
  const totalExpected = filteredShifts?.filter(s => s.status === 'closed').reduce((sum, s) => sum + Number(s.expected_balance || 0), 0) || 0;
  const totalActual = filteredShifts?.filter(s => s.status === 'closed').reduce((sum, s) => sum + Number(s.actual_balance || 0), 0) || 0;
  const totalDiff = totalActual - totalExpected;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shift Kasir</h1>
          <p className="text-muted-foreground mt-1">Pantau sesi kerja kasir dan rekonsiliasi uang tunai secara riil-time.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-primary" /> Total Penjualan
          </p>
          <h3 className="text-2xl font-black text-foreground">
            Rp {totalSales.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">Dari {filteredShifts?.length || 0} sesi terfilter</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
             <DollarSign className="h-3 w-3 text-blue-500" /> Saldo Aktual (Tercatat)
          </p>
          <h3 className="text-2xl font-black text-blue-500">
            Rp {totalActual.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1 text-blue-400">Total uang tunai yang dilaporkan</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-2">
             <AlertCircle className="h-3 w-3 text-amber-500" /> Selisih Kumulatif
          </p>
          <h3 className={cn(
            "text-2xl font-black",
            totalDiff < 0 ? "text-destructive" : totalDiff > 0 ? "text-emerald-500" : "text-foreground"
          )}>
            {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">Perbandingan Aktual vs Sistem</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
            <div className="flex -space-x-2 mb-2">
                {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-card bg-secondary flex items-center justify-center font-bold text-[10px]">
                        {filteredShifts?.filter(s => s.status === 'open').length || 0}
                    </div>
                ))}
            </div>
            <p className="text-xs font-bold uppercase text-emerald-500">Sesi Aktif</p>
        </div>
      </div>

      {/* Filter and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari kasir atau ID..." 
            className="pl-10 bg-background border-border rounded-xl h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-background border-border rounded-xl h-11">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="open">Terbuka (Aktif)</SelectItem>
            <SelectItem value="closed">Ditutup</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="date"
            className="pl-10 bg-background border-border rounded-xl h-11"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <Button 
          variant="outline" 
          onClick={() => {setSearch(''); setStatusFilter('all'); setDateFilter('');}}
          className="rounded-xl h-11 border-border text-xs font-semibold uppercase tracking-wider"
        >
            Reset Filter
        </Button>
      </div>

      {/* Shifts Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border">
              <TableHead className="font-bold text-xs uppercase text-muted-foreground">Waktu</TableHead>
              <TableHead className="font-bold text-xs uppercase text-muted-foreground">Kasir</TableHead>
              <TableHead className="font-bold text-xs uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="font-bold text-xs uppercase text-muted-foreground">Modal</TableHead>
              <TableHead className="font-bold text-xs uppercase text-muted-foreground">Penjualan</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase text-muted-foreground">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredShifts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <History className="h-10 w-10 mb-2" />
                    <p className="font-semibold">Tidak ada riwayat ditemukan</p>
                    <p className="text-xs">Ubah filter atau cari kata kunci lain</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredShifts?.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors border-border group">
                  <TableCell>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">{format(new Date(s.opening_time), 'HH:mm')}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{format(new Date(s.opening_time), 'dd MMM yyyy', { locale: id })}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">
                            {s.profiles?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                       </div>
                       <span className="font-semibold text-sm">{s.profiles?.full_name || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                      s.status === 'open' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {s.status === 'open' ? <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <CheckCircle2 className="h-3 w-3" />}
                      {s.status === 'open' ? 'Aktif' : 'Selesai'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    Rp {Number(s.opening_balance).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                        <p className="font-black text-primary text-sm">Rp {Number(s.total_sales || 0).toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-muted-foreground">Diharapkan: {Number(s.expected_balance || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2 h-9 px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedShift(s)}
                    >
                      <Eye className="h-4 w-4" /> <span className="text-xs font-bold uppercase">Detail</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="sm:max-w-[650px] bg-card border-border p-0 overflow-hidden rounded-3xl">
          <div className="bg-primary/5 p-6 border-b border-border">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <History className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black">Detail Sesi Kasir</DialogTitle>
                        <p className="text-xs text-muted-foreground font-mono">ID: {selectedShift?.id}</p>
                    </div>
                </div>
            </DialogHeader>
          </div>
          
          {selectedShift && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Waktu Buka</p>
                    <p className="font-bold text-sm">{format(new Date(selectedShift.opening_time), 'PPpp', { locale: id })}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Clock className="h-3 w-3" /> Waktu Tutup</p>
                    <p className="font-bold text-sm">{selectedShift.closing_time ? format(new Date(selectedShift.closing_time), 'PPpp', { locale: id }) : 'Masih Terbuka'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 rounded-2xl gradient-primary text-primary-foreground space-y-2">
                    <p className="text-[10px] font-black uppercase opacity-80 letter-spacing-wide">Total Omzet</p>
                    <h4 className="text-2xl font-black italic">Rp {Number(selectedShift.total_sales || 0).toLocaleString('id-ID')}</h4>
                    <div className="flex items-center gap-2 opacity-60 text-[10px] font-bold">
                        <ShoppingCart className="h-3 w-3" /> Berdasarkan transaksi sistem
                    </div>
                 </div>
                 <div className="p-5 rounded-2xl bg-card border-2 border-primary/20 space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Modal Laci</p>
                    <h4 className="text-2xl font-black text-foreground">Rp {Number(selectedShift.opening_balance).toLocaleString('id-ID')}</h4>
                     <p className="text-[10px] text-muted-foreground font-medium">Uang laci awal saat buka</p>
                 </div>
              </div>

              {selectedShift.status === 'closed' && (
                <div className="bg-secondary/30 rounded-3xl p-6 border border-border">
                    <div className="grid grid-cols-3 gap-6 items-center">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Posisi Saldo</p>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Rp {Number(selectedShift.expected_balance || 0).toLocaleString('id-ID')}</span>
                                <span className="text-[8px] text-muted-foreground">(Sistem)</span>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black uppercase text-blue-500">Saldo Aktual</p>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[8px] text-muted-foreground">(Input Fisik)</span>
                                <span className="font-black text-lg text-blue-600">Rp {Number(selectedShift.actual_balance || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                        <p className={cn(
                            "text-xs font-black uppercase",
                            selectedShift.difference < 0 ? "text-destructive" : "text-emerald-500"
                        )}>
                            Selisih: {selectedShift.difference > 0 ? 'Surplus' : selectedShift.difference < 0 ? 'Minus' : 'Sesuai'}
                        </p>
                        <p className={cn(
                            "text-xl font-black",
                            selectedShift.difference < 0 ? "text-destructive" : "text-emerald-500"
                        )}>
                            {selectedShift.difference > 0 ? '+' : ''}{Number(selectedShift.difference || 0).toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" /> Rincian Transaksi
                    </h3>
                    <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-lg">
                        {shiftTransactions?.length || 0} Trx
                    </span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingTransactions ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : shiftTransactions?.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl opacity-50">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase">Kosong</p>
                    </div>
                  ) : shiftTransactions?.map((tr: any) => (
                    <div key={tr.id} className="flex justify-between items-center p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-all group/item">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center font-black text-xs text-muted-foreground">
                            {tr.payment_method === 'Tunai' ? '💸' : '💳'}
                         </div>
                         <div>
                            <p className="text-[10px] font-mono text-muted-foreground">{tr.id.substring(0, 8)}</p>
                            <p className="text-xs font-bold">{format(new Date(tr.created_at), 'HH:mm:ss')}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-primary mb-0.5">{tr.payment_method}</p>
                        <p className="font-black text-sm">Rp {Number(tr.total_amount).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

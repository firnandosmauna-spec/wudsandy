import { useState, useMemo } from 'react';
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
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  History, 
  Receipt, 
  Eye, 
  FileText,
  Clock,
  User,
  CreditCard,
  Banknote,
  Navigation,
  Check,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  Printer,
  Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { DateRange as DateRangeType } from "react-day-picker";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

import { useProfiles } from '@/hooks/useProfiles';
import { useStoreConfig } from '@/hooks/useStoreConfig';

export default function TransactionHistory() {
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showManualOnly, setShowManualOnly] = useState(false);
  const { data: config } = useStoreConfig();
  const storeName = config?.store_name || 'WUDkopi';
  const printRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('thismonth');
  const { data: profiles = [] } = useProfiles();

  // Fetch Transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transaction_history', dateRange],
    queryFn: async () => {
      let query = (supabase as any)
        .from('transactions')
        .select(`
          *,
          profiles(full_name),
          customers(name),
          transaction_items(*, products(name, category_id))
        `)
        .order('created_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch Items for Detail
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['transaction_items_audit', selectedTransaction?.id],
    enabled: !!selectedTransaction,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transaction_items')
        .select('*, products(name)')
        .eq('transaction_id', selectedTransaction.id);
      if (error) throw error;
      return data;
    }
  });

  const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

  const processedTransactions = useMemo(() => {
    return (transactions as any[])?.map(t => {
      const bubukKopiTotal = (t.transaction_items || [])
        .filter((item: any) => item.products?.category_id === COFFEE_POWDER_CATEGORY_ID)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      return {
        ...t,
        adjustedTotal: Number(t.total_amount) - bubukKopiTotal
      };
    }).filter(t => t.adjustedTotal > 0) || [];
  }, [transactions]);

  const filteredTransactions = processedTransactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.receipt_number && t.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
      t.payment_method.toLowerCase().includes(search.toLowerCase()) ||
      t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.customers?.name?.toLowerCase().includes(search.toLowerCase());
    
    const hasManualItems = (t.transaction_items || []).some((item: any) => !item.product_id);
    const matchesManualFilter = !showManualOnly || hasManualItems;

    return matchesSearch && matchesManualFilter;
  });

  const getPaymentIcon = (method: string) => {
    if (method.toLowerCase().includes('tunai')) return <Banknote className="h-4 w-4 text-emerald-500" />;
    return <CreditCard className="h-4 w-4 text-blue-500" />;
  };

  const getCashierName = (transaction: any) => {
    if (transaction.profiles?.full_name) return transaction.profiles.full_name;
    const profile = profiles.find((p: any) => p.id === transaction.user_id);
    return profile?.full_name || 'System';
  };

  const handlePresetChange = (preset: string) => {
    setRangePreset(preset);
    const today = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'last7days':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'thismonth':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Riwayat_Transaksi_${format(new Date(), 'yyyyMMdd')}`,
  });

  const handleExportExcel = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const data = filteredTransactions.map(t => ({
        'Tanggal': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
        'ID Transaksi': (t.receipt_number || t.id.substring(0, 8)).toUpperCase(),
        'Produk': (t.transaction_items || []).map((i: any) => `${i.product_name || i.products?.name || 'Produk'}${!i.product_id ? ' (Manual)' : ''} (${i.quantity})`).join(', '),
        'Metode Bayar': t.payment_method || 'Tunai',
        'Kasir': getCashierName(t),
        'Pelanggan': t.customers?.name || 'Guest',
        'Total (Rp)': t.adjustedTotal
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");

      // Auto-size columns robustly
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        const maxWidths = keys.map(key => {
          let maxLen = key.length;
          for (const row of data) {
            const val = row[key as keyof typeof row];
            const len = val ? val.toString().length : 0;
            if (len > maxLen) maxLen = len;
          }
          return { wch: maxLen + 2 };
        });
        ws['!cols'] = maxWidths;
      }

      XLSX.writeFile(wb, `Riwayat_Transaksi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      toast.success('Excel berhasil diunduh');
    } catch (error) {
      console.error('Export Excel Error:', error);
      toast.error('Gagal mengekspor data ke Excel');
    }
  };

  const totalSales = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.adjustedTotal, 0);
  }, [filteredTransactions]);

  const totalTransactions = filteredTransactions.length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">Riwayat Transaksi</h1>
          <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Audit seluruh jejak transaksi {storeName}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-xl border-border bg-card shadow-sm font-bold text-xs hover:bg-accent transition-all h-9"
            onClick={() => setIsPreviewOpen(true)}
            disabled={isLoading || filteredTransactions.length === 0}
          >
            <Eye className="mr-2 h-4 w-4 text-primary" /> Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-xl border-border bg-card shadow-sm font-bold text-xs hover:bg-accent transition-all h-9"
            onClick={() => handlePrint()}
            disabled={isLoading || filteredTransactions.length === 0}
          >
            <FileText className="mr-2 h-4 w-4 text-red-500" /> Export PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-xl border-border bg-card shadow-sm font-bold text-xs hover:bg-accent transition-all h-9"
            onClick={handleExportExcel}
            disabled={isLoading || filteredTransactions.length === 0}
          >
            <TableIcon className="mr-2 h-4 w-4 text-emerald-500" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card p-4 md:p-6 rounded-3xl border border-border space-y-4 md:space-y-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: 'last7days', label: '7 Hari' },
              { id: 'thismonth', label: 'Bulan Ini' },
            ].map((p) => (
              <Button
                key={p.id}
                variant={rangePreset === p.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange(p.id)}
                className={cn(
                  "rounded-xl h-9 font-bold px-4",
                  rangePreset === p.id ? "gradient-primary text-white" : "hover:bg-accent"
                )}
              >
                {p.label}
              </Button>
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={rangePreset === 'custom' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRangePreset('custom')}
                  className={cn(
                    "rounded-xl h-9 px-4 font-bold gap-2 text-foreground",
                    rangePreset === 'custom' && "gradient-primary text-white"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Custom
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-border" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                      setDateRange(range);
                      setRangePreset('custom');
                  }}
                  numberOfMonths={2}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden xl:block h-10 w-px bg-border mx-2" />

          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/50 flex-1 xl:flex-none">
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-xl">
              <Label className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">Dari</Label>
              <Input 
                type="date" 
                className="h-8 w-full bg-transparent border-none font-bold text-xs p-0 focus-visible:ring-0" 
                value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange(prev => ({ ...prev, from: newDate }));
                  setRangePreset('custom');
                }}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 rounded-xl">
              <Label className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">Sampai</Label>
              <Input 
                type="date" 
                className="h-8 w-full bg-transparent border-none font-bold text-xs p-0 focus-visible:ring-0" 
                value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange(prev => ({ ...prev, to: newDate }));
                  setRangePreset('custom');
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Cari transaksi berdasarkan ID, nama kasir, pelanggan, atau metode..." 
              className="pl-12 bg-secondary/50 border-border rounded-2xl h-12 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showManualOnly ? "default" : "outline"}
            onClick={() => setShowManualOnly(!showManualOnly)}
            className={cn(
              "rounded-2xl h-12 px-6 font-bold flex items-center gap-2 transition-all",
              showManualOnly ? "gradient-primary text-white shadow-lg" : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            <Navigation className={cn("h-4 w-4", showManualOnly && "animate-pulse")} />
            {showManualOnly ? "MENAMPILKAN MANUAL" : "FILTER MANUAL"}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="responsive-table-container">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-muted/50 table-header-glass">
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredTransactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Tidak ada data transaksi.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions?.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs uppercase bg-secondary px-1.5 py-0.5 rounded text-foreground/80">{t.receipt_number || t.id.substring(0, 8)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[180px] space-y-1">
                      {(t.transaction_items || []).map((item: any, idx: number) => (
                        <div key={idx} className="text-[10px] font-bold leading-tight flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          <span className="text-foreground truncate">{item.product_name || item.products?.name || 'Produk'}</span>
                          {!item.product_id && (
                            <span className="bg-purple-500/10 text-purple-600 px-1 rounded-[4px] text-[8px] font-black uppercase tracking-tighter ml-1">MANUAL</span>
                          )}
                          <span className="text-muted-foreground ml-auto">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <User className="h-3 w-3 text-muted-foreground" />
                       <span className="text-sm font-semibold">{getCashierName(t)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {t.customers?.name || <span className="text-muted-foreground italic">Guest</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      {getPaymentIcon(t.payment_method)}
                      {t.payment_method}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground">
                    Rp {t.adjustedTotal.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl hover:bg-primary/10 hover:text-primary gap-2"
                      onClick={() => setSelectedTransaction(t)}
                    >
                      <Eye className="h-4 w-4" /> Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Audit Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border p-0 overflow-hidden rounded-3xl">
          <div className="gradient-primary p-6 text-primary-foreground">
             <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Receipt className="h-6 w-6" />
                         </div>
                         <span>Audit Transaksi</span>
                    </div>
                    <span className="text-xs font-mono opacity-80 uppercase tracking-widest">
                        {selectedTransaction?.receipt_number || selectedTransaction?.id.substring(0, 8)}
                    </span>
                </DialogTitle>
             </DialogHeader>
          </div>
          
          {selectedTransaction && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                 <div className="space-y-1">
                    <p className="text-muted-foreground uppercase font-black opacity-50 tracking-tighter">Status</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">
                        <Check className="h-3 w-3" /> Berhasil
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground uppercase font-black opacity-50 tracking-tighter">Waktu</p>
                    <p className="font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(selectedTransaction.created_at), 'PPPPpppp', { locale: id })}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground uppercase font-black opacity-50 tracking-tighter">Metode</p>
                    <p className="font-bold flex items-center gap-1.5">{getPaymentIcon(selectedTransaction.payment_method)} {selectedTransaction.payment_method}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground uppercase font-black opacity-50 tracking-tighter">Meja / Lokasi</p>
                    <p className="font-bold flex items-center gap-1.5"><Navigation className="h-3 w-3" /> {selectedTransaction.table_number || 'Takeaway'}</p>
                 </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-sm font-black uppercase text-muted-foreground opacity-60 tracking-widest">Detail Item</h3>
                 <div className="bg-secondary/30 rounded-2xl border border-border overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                        {isLoadingItems ? (
                             <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : items?.filter((item: any) => item.products?.category_id !== COFFEE_POWDER_CATEGORY_ID).map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm">{item.product_name || item.products?.name || 'Produk'}</p>
                                        {!item.product_id && (
                                            <span className="bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase">MANUAL</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                </div>
                                <p className="font-black text-sm">Rp {(item.quantity * Number(item.price)).toLocaleString('id-ID')}</p>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest leading-none mb-1">Shop Total (Excl. Bubuk)</p>
                    <p className="text-2xl font-black text-primary">Rp {selectedTransaction.adjustedTotal.toLocaleString('id-ID')}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest leading-none mb-1">Grand Total</p>
                    <p className="text-sm font-bold text-muted-foreground">Rp {Number(selectedTransaction.total_amount).toLocaleString('id-ID')}</p>
                 </div>
              </div>

              <DialogFooter>
                 <Button variant="outline" className="w-full rounded-xl border-border h-11">
                    <FileText className="mr-2 h-4 w-4" /> Cetak Salinan Struk
                 </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border bg-card p-0">
          <DialogHeader className="p-6 bg-primary/5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
            <DialogTitle className="flex justify-between items-center text-foreground">
              <span className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Eye className="h-5 w-5 text-primary" /> Pratinjau Audit Transaksi</span>
              <Button onClick={() => handlePrint()} className="gradient-primary text-white rounded-xl h-10 px-6 font-black shadow-lg">
                <Printer className="mr-2 h-4 w-4" /> CETAK LAPORAN
              </Button>
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Printable Content (Off-screen for reliability) */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
        <div className="p-12 bg-white text-black min-h-[1000px]" ref={printRef}>
          <div className="text-center space-y-3 mb-10 pb-8 border-b-4 border-double border-gray-900">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Laporan Audit Transaksi</h2>
            <div className="flex justify-center gap-4 text-sm font-bold text-gray-600 uppercase tracking-widest flex-wrap">
              <span>Mulai: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</span>
              <span>Sampai: {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
            </div>
            <p className="text-[10px] font-medium text-gray-400">Dicetak pada: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Transaksi</p>
              <p className="text-xl font-black text-gray-900">{totalTransactions}</p>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest mb-1">Total Omzet (Adjusted)</p>
              <p className="text-xl font-black text-primary">Rp {totalSales.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left text-[9px] font-black uppercase tracking-widest">
                <th className="py-4 pr-2">Waktu</th>
                <th className="py-4 px-2">ID</th>
                <th className="py-4 px-2">Daftar Produk</th>
                <th className="py-4 px-2">Kasir</th>
                <th className="py-4 px-2">Pelanggan</th>
                <th className="py-4 pl-2 text-right">Nilai (IDR)</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold text-gray-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-4 pr-2 whitespace-nowrap">{format(new Date(t.created_at), 'dd/MM/yy HH:mm')}</td>
                  <td className="py-4 px-2 uppercase">{t.id.substring(0, 8)}</td>
                  <td className="py-4 px-2">
                    {(t.transaction_items || []).map((item: any, idx: number) => (
                      <div key={idx} className="whitespace-nowrap">{item.product_name || item.products?.name || 'Produk'} (x{item.quantity})</div>
                    ))}
                  </td>
                  <td className="py-4 px-2">{getCashierName(t)}</td>
                  <td className="py-4 px-2 capitalize">{t.customers?.name || 'Guest'}</td>
                  <td className="py-4 pl-2 text-right whitespace-nowrap">Rp {t.adjustedTotal.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900 bg-gray-50">
                <td colSpan={5} className="py-6 font-black uppercase text-right text-xs pr-4">Total Akhir Periode</td>
                <td className="py-6 pl-2 text-right font-black text-base text-primary">Rp {totalSales.toLocaleString('id-ID')}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-24 grid grid-cols-2 gap-20 px-10">
            <div className="text-center border-t border-gray-300 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Admin / Saksi</p>
            </div>
            <div className="text-center border-t border-gray-300 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Pimpinan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

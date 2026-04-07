import { useState, useMemo, useRef } from 'react';
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
  Loader2, 
  Search, 
  Calendar as CalendarIcon, 
  FileText, 
  Download,
  Filter,
  ChevronDown,
  User,
  Eye,
  Printer,
  Table as TableIcon,
  ShoppingCart,
  Banknote,
  CreditCard
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trash2, 
  Edit, 
  PlusCircle, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange as DateRangeType } from "react-day-picker";
import { useProfiles } from '@/hooks/useProfiles';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

export default function SalesReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('thismonth');
  const [cashierId, setCashierId] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    total_amount: '',
    payment_method: 'Tunai',
    created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useProfiles();

  // Fetch Transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions_report', dateRange, cashierId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('transactions')
        .select('*, profiles(full_name), transaction_items(*, products(name, category_id))')
        .order('created_at', { ascending: false });

      if (cashierId !== 'all') {
        query = query.eq('user_id', cashierId);
      }

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

  // Fetch Transaction Items
  const { data: transactionItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['transaction_items_report', selectedTransaction?.id],
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .insert([{
          ...newData,
          total_amount: Number(newData.total_amount),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions_report'] });
      toast.success('Transaksi berhasil ditambahkan');
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      toast.error('Gagal menambah transaksi: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .update({
          ...updateData,
          total_amount: Number(updateData.total_amount)
        })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions_report'] });
      toast.success('Transaksi berhasil diperbarui');
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast.error('Gagal memperbarui transaksi: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions_report'] });
      toast.success('Transaksi berhasil dihapus');
      setIsDeleteOpen(false);
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus transaksi: ' + error.message);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionToEdit) {
      updateMutation.mutate({
        id: transactionToEdit.id,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        created_at: formData.created_at
      });
    }
  };

  const openEditDialog = (t: any) => {
    setTransactionToEdit(t);
    setFormData({
      total_amount: t.total_amount.toString(),
      payment_method: t.payment_method,
      created_at: format(new Date(t.created_at), "yyyy-MM-dd'T'HH:mm")
    });
    setIsEditOpen(true);
  };

  const openAddDialog = () => {
    setFormData({
      total_amount: '',
      payment_method: 'Tunai',
      created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
    setIsAddOpen(true);
  };

  const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

  const processedTransactions = useMemo(() => {
    return transactions.map(t => {
      const bubukKopiTotal = (t.transaction_items || [])
        .filter((item: any) => item.products?.category_id === COFFEE_POWDER_CATEGORY_ID)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      return {
        ...t,
        adjustedTotal: Number(t.total_amount) - bubukKopiTotal
      };
    }).filter(t => t.adjustedTotal > 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return processedTransactions.filter(t => {
      const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
                            (t.receipt_number && t.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
                            (t.payment_method || '').toLowerCase().includes(search.toLowerCase());
      
      const method = (t.payment_method || 'Tunai').toLowerCase().trim();
      const isTunai = method === 'tunai' || method === 'cash';
      const matchesPayment = paymentFilter === 'all' || 
                            (paymentFilter === 'tunai' && isTunai) ||
                            (paymentFilter === 'nontunai' && !isTunai);
      
      return matchesSearch && matchesPayment;
    });
  }, [processedTransactions, search, paymentFilter]);

  const totalSales = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.adjustedTotal, 0);
  }, [filteredTransactions]);

  const totalTunai = useMemo(() => {
    return processedTransactions
      .filter(t => {
        const method = (t.payment_method || 'Tunai').toLowerCase().trim();
        return method === 'tunai' || method === 'cash';
      })
      .reduce((sum, t) => sum + t.adjustedTotal, 0);
  }, [processedTransactions]);

  const totalNonTunai = useMemo(() => {
    return processedTransactions
      .filter(t => {
        const method = (t.payment_method || 'Tunai').toLowerCase().trim();
        return method !== 'tunai' && method !== 'cash';
      })
      .reduce((sum, t) => sum + t.adjustedTotal, 0);
  }, [processedTransactions]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Penjualan_${format(new Date(), 'yyyyMMdd')}`,
  });

  const getCashierName = (transaction: any) => {
    if (transaction.profiles?.full_name) return transaction.profiles.full_name;
    const profile = profiles.find(p => p.id === transaction.user_id);
    return profile?.full_name || 'System';
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const data = filteredTransactions.map(t => ({
      'Tanggal': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      'ID Transaksi': (t.receipt_number || t.id.substring(0, 8)).toUpperCase(),
      'Metode Bayar': t.payment_method,
      'Kasir': getCashierName(t),
      'Produk': (t.transaction_items || []).map((i: any) => `${i.products?.name} (${i.quantity})`).join(', '),
      'Total (Rp)': t.adjustedTotal
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

    // Auto-size columns
    const maxWidths = Object.keys(data[0]).map(key => 
      Math.max(...data.map(obj => obj[key as keyof typeof obj]?.toString().length ?? 0), key.length)
    );
    ws['!cols'] = maxWidths.map(w => ({ w: w + 2 }));

    XLSX.writeFile(wb, `Laporan_Penjualan_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    toast.success('Laporan Excel berhasil diunduh');
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
          <p className="text-muted-foreground mt-1">Pantau performa penjualan harian toko Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-border bg-card pos-shadow font-black"
            onClick={() => setIsPreviewOpen(true)}
            disabled={isLoading || filteredTransactions.length === 0}
          >
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-border bg-card pos-shadow font-black"
            onClick={handleExportExcel}
            disabled={isLoading || filteredTransactions.length === 0}
          >
            <TableIcon className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button 
            className="gradient-primary text-white rounded-xl h-11 px-6 font-black shadow-lg pos-shadow"
            onClick={openAddDialog}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Transaksi Baru
          </Button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="card-grid-responsive md:grid-cols-4">
        <div className="md:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all card-padding">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total Pendapatan</p>
              <p className="text-2xl md:text-3xl font-black text-foreground">Rp {totalSales.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Periode Aktif</p>
            <p className="text-[10px] font-black text-foreground max-w-[100px] leading-tight">
              {dateRange?.from ? format(dateRange.from, "dd MMM", { locale: id }) : 'Awal'} - {dateRange?.to ? format(dateRange.to, "dd MMM", { locale: id }) : 'Sekarang'}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-emerald-500/50 transition-all card-padding">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Banknote className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total Tunai</p>
            <p className="text-xl font-black text-emerald-600">Rp {totalTunai.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-blue-500/50 transition-all card-padding">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Non-Tunai</p>
            <p className="text-xl font-black text-blue-600">Rp {totalNonTunai.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-card p-4 md:p-6 rounded-3xl border border-border space-y-4 md:space-y-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
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
                  "rounded-xl h-9 font-bold px-4 transition-all text-xs",
                  rangePreset === p.id ? "gradient-primary text-white shadow-md" : "hover:bg-accent text-muted-foreground"
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
                    "rounded-xl h-9 px-4 font-bold gap-2 text-xs",
                    rangePreset === 'custom' ? "gradient-primary text-white shadow-md" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Kustom
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-border shadow-2xl" align="end">
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

          <div className="hidden xl:block h-10 w-px bg-border mx-2" />

          <div className="flex flex-wrap items-center gap-3">
            <Select value={cashierId} onValueChange={setCashierId}>
                <SelectTrigger className="w-full md:w-[200px] h-11 rounded-2xl bg-secondary/50 border-border font-bold">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <SelectValue placeholder="Pilih Kasir" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-card">
                    <SelectItem value="all" className="font-bold">Semua Kasir</SelectItem>
                    {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-11 rounded-2xl bg-secondary/50 border-border font-bold">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Banknote className="h-4 w-4" />
                        <SelectValue placeholder="Metode" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-card">
                    <SelectItem value="all" className="font-bold">Semua Metode</SelectItem>
                    <SelectItem value="tunai" className="font-bold text-emerald-600">Tunai (Cash)</SelectItem>
                    <SelectItem value="nontunai" className="font-bold text-blue-600">Non-Tunai</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Cari transaksi berdasarkan ID atau metode pembayaran..." 
            className="pl-12 bg-secondary/50 border-border rounded-2xl h-12 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="responsive-table-container">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-muted/50 table-header-glass">
            <TableRow>
              <TableHead className="py-4 px-6">Tgl Transaksi</TableHead>
              <TableHead>Metode Bayar</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right px-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-bold animate-pulse">Memuat Data Penjualan...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  Belum ada transaksi di periode ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-accent/30 transition-all group">
                  <TableCell className="px-6 py-4">
                    <div className="text-sm font-bold text-foreground">
                        {format(new Date(t.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                     <div className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(t.created_at), 'HH:mm')} • {(t.receipt_number || t.id.substring(0, 8)).toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {t.payment_method}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] space-y-1">
                      {(t.transaction_items || []).map((item: any, idx: number) => (
                        <div key={idx} className="text-[10px] font-bold leading-tight flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          <span className="text-foreground truncate">{item.products?.name}</span>
                          <span className="text-muted-foreground ml-auto">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-muted-foreground">
                    {getCashierName(t)}
                  </TableCell>
                  <TableCell className="font-black text-primary">
                    Rp {t.adjustedTotal.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl font-bold hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedTransaction(t)}
                    >
                      Detail
                    </Button>
                    <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"
                        onClick={() => openEditDialog(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setTransactionToDelete(t);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <PlusCircle className="h-5 w-5 text-primary" /> Transaksi Manual Baru
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add_total">Total Pembayaran (Rp)</Label>
              <Input 
                id="add_total"
                type="number" 
                placeholder="15000"
                value={formData.total_amount}
                onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                required
                className="rounded-xl h-12 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_method">Metode Pembayaran</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(val) => setFormData({...formData, payment_method: val})}
              >
                <SelectTrigger id="add_method" className="h-12 rounded-xl border-border font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card">
                  <SelectItem value="Tunai" className="font-bold">Tunai (Cash)</SelectItem>
                  <SelectItem value="QRIS" className="font-bold">QRIS</SelectItem>
                  <SelectItem value="Transfer" className="font-bold">Transfer Bank</SelectItem>
                  <SelectItem value="Debit" className="font-bold">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_date">Waktu Transaksi</Label>
              <Input 
                id="add_date"
                type="datetime-local" 
                value={formData.created_at}
                onChange={(e) => setFormData({...formData, created_at: e.target.value})}
                required
                className="rounded-xl h-12 border-border"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setIsAddOpen(false)}>BATAL</Button>
              <Button type="submit" className="gradient-primary text-white rounded-xl h-11 px-6 font-black" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                SIMPAN TRANSAKSI
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
               <Edit className="h-5 w-5" /> Edit Transaksi
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_total">Total Pembayaran (Rp)</Label>
              <Input 
                id="edit_total"
                type="number" 
                value={formData.total_amount}
                onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                required
                className="rounded-xl h-12 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_method">Metode Pembayaran</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(val) => setFormData({...formData, payment_method: val})}
              >
                <SelectTrigger id="edit_method" className="h-12 rounded-xl border-border font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card">
                  <SelectItem value="Tunai" className="font-bold">Tunai (Cash)</SelectItem>
                  <SelectItem value="QRIS" className="font-bold">QRIS</SelectItem>
                  <SelectItem value="Transfer" className="font-bold">Transfer Bank</SelectItem>
                  <SelectItem value="Debit" className="font-bold">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_date">Waktu Transaksi</Label>
              <Input 
                id="edit_date"
                type="datetime-local" 
                value={formData.created_at}
                onChange={(e) => setFormData({...formData, created_at: e.target.value})}
                required
                className="rounded-xl h-12 border-border"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setIsEditOpen(false)}>BATAL</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 font-black" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                PUBLISH PERUBAHAN
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
               <AlertCircle className="h-5 w-5" /> Hapus Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data transaksi ID <span className="font-mono font-bold text-foreground">{(transactionToDelete?.id || '').substring(0, 8)}</span> akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">BATALKAN</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => transactionToDelete && deleteMutation.mutate(transactionToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              HAPUS PERMANEN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl overflow-hidden p-0 border-border bg-card">
          <DialogHeader className="bg-primary/5 p-6 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" /> Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-4 border-dashed">
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">ID Transaksi</p>
                    <p className="font-mono text-sm font-bold uppercase text-foreground">{selectedTransaction?.id}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Status</p>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black">SUKSES</span>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-xs font-black text-foreground uppercase tracking-widest border-l-2 border-primary pl-2">Item Terjual</p>
                {isLoadingItems ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-3">
                        {transactionItems.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{item.products?.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.quantity}x @ Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                </div>
                                <p className="font-black text-sm text-foreground">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl flex justify-between items-center">
                <div>
                   <p className="font-black text-xs text-muted-foreground uppercase">Shop Subtotal (Excl. Bubuk)</p>
                   <p className="text-xl font-black text-primary">Rp {selectedTransaction?.adjustedTotal.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                   <p className="font-black text-[10px] text-muted-foreground uppercase">Grand Total (Struk)</p>
                   <p className="text-sm font-bold text-muted-foreground">Rp {Number(selectedTransaction?.total_amount).toLocaleString('id-ID')}</p>
                </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t border-border mt-0">
             <Button variant="ghost" className="w-full rounded-2xl font-black h-12 text-foreground" onClick={() => setSelectedTransaction(null)}>TUTUP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border bg-card p-0">
          <DialogHeader className="p-6 bg-primary/5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
            <DialogTitle className="flex justify-between items-center text-foreground">
              <span className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Eye className="h-5 w-5 text-primary" /> Pratinjau Laporan</span>
              <Button onClick={() => handlePrint()} className="gradient-primary text-white rounded-xl h-10 px-6 font-black shadow-lg">
                <Printer className="mr-2 h-4 w-4" /> CETAK LAPORAN
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-12 bg-white text-black min-h-[1000px]" ref={printRef}>
            <div className="text-center space-y-3 mb-12 pb-8 border-b-4 border-double border-gray-900">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Laporan Pendapatan Penjualan</h2>
              <div className="flex justify-center gap-4 text-sm font-bold text-gray-600 uppercase tracking-widest flex-wrap">
                <span>Mulai: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</span>
                <span>Sampai: {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                <span>Metode: {paymentFilter === 'all' ? 'Semua' : paymentFilter === 'tunai' ? 'Tunai' : 'Non-Tunai'}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-400">Dicetak pada: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-12">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaksi</p>
                <p className="text-xl font-black text-gray-900">{filteredTransactions.length}</p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Total Tunai</p>
                <p className="text-xl font-black text-emerald-600">Rp {totalTunai.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Non-Tunai</p>
                <p className="text-xl font-black text-blue-600">Rp {totalNonTunai.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest mb-1">Total Omzet</p>
                <p className="text-xl font-black text-primary">Rp {totalSales.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900 text-left text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 pr-2">Waktu Transaksi</th>
                  <th className="py-4 px-2 text-center">Metode</th>
                  <th className="py-4 px-2">Daftar Produk</th>
                  <th className="py-4 px-2 text-center">Kasir</th>
                  <th className="py-4 pl-2 text-right">Nilai (IDR)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-gray-800">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-4 pr-2">{format(new Date(t.created_at), 'dd/MM/yy HH:mm')}</td>
                    <td className="py-4 px-2 text-center uppercase tracking-wider text-[8px]">{t.payment_method}</td>
                    <td className="py-4 px-2 text-[9px]">
                      {(t.transaction_items || []).map((item: any, idx: number) => (
                        <div key={idx}>{item.products?.name} (x{item.quantity})</div>
                      ))}
                    </td>
                    <td className="py-4 px-2 text-center">{getCashierName(t)}</td>
                    <td className="py-4 pl-2 text-right">Rp {t.adjustedTotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-900 bg-gray-50">
                  <td colSpan={3} className="py-6 font-black uppercase text-right text-xs pr-4">Total Akhir Periode</td>
                  <td className="py-6 pl-4 text-right font-black text-lg text-primary">Rp {totalSales.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-24 grid grid-cols-2 gap-20 px-10">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 mb-20 uppercase tracking-widest">Kasir / Saksi</p>
                <div className="inline-block w-full border-b border-gray-300"></div>
                <p className="text-[10px] font-black mt-2 uppercase tracking-widest">Tanda Tangan</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-500 mb-20 uppercase tracking-widest">Pimpinan / Pemilik</p>
                <div className="inline-block w-full border-b border-gray-900"></div>
                <p className="text-[10px] font-black mt-2 uppercase tracking-widest">Otorisasi Resmi</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

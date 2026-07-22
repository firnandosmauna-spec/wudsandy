import { useState, useMemo, useRef } from 'react';
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
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Calendar as CalendarIcon, 
  ShoppingCart, 
  Plus,
  Filter,
  Trash2, 
  Edit2, 
  Download, 
  ChevronDown, 
  User, 
  Eye, 
  Printer, 
  Table as TableIcon,
  FileText,
  AlertCircle,
  Pencil,
  Trash
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange as DateRangeType } from "react-day-picker";
import { useProfiles } from '@/hooks/useProfiles';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

export default function PurchaseReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('today');
  const [cashierId, setCashierId] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    total_amount: '',
    invoice_number: '',
    description: '',
    created_at: format(new Date(), 'yyyy-MM-dd')
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<any>(null);

  const queryClient = useQueryClient();
  const { data: profiles = [] } = useProfiles();

  const { data: authUser } = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch Purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases_report', dateRange, cashierId],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('purchases')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(50000);

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
        
        if (error) {
           if (error.message.includes('profiles')) {
             const fallback = await (supabase as any)
               .from('purchases')
               .select('*')
               .order('created_at', { ascending: false })
               .limit(50000);
             if (fallback.error) throw fallback.error;
             return fallback.data;
           }
           throw error;
        }
        return data;
      } catch (err: any) {
        toast.error("Gagal memuat data", { description: err.message });
        throw err;
      }
    }
  });

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPurchase) {
        const { error } = await (supabase as any)
          .from('purchases')
          .update(data)
          .eq('id', editingPurchase.id);
        if (error) throw error;
      } else {
        const finalData = { ...data, user_id: authUser?.id };
        const { error } = await (supabase as any)
          .from('purchases')
          .insert([finalData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases_report'] });
      setIsAddOpen(false);
      setEditingPurchase(null);
      resetForm();
      toast.success(editingPurchase ? 'Data diperbarui' : 'Data ditambahkan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('purchases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases_report'] });
      toast.success('Data dihapus');
    }
  });

  const resetForm = () => {
    setFormData({ supplier_name: '', total_amount: '', invoice_number: '', description: '', created_at: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleEditClick = (p: any) => {
    setEditingPurchase(p);
    setFormData({
      supplier_name: p.supplier_name || '',
      total_amount: p.total_amount.toString(),
      invoice_number: p.invoice_number || '',
      description: p.description || '',
      created_at: p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleDeleteClick = (p: any) => {
    setPurchaseToDelete(p);
    setIsDeleteOpen(true);
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p: any) => 
      (p.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.invoice_number || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [purchases, search]);

  const totalExpense = useMemo(() => {
    return filteredPurchases.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
  }, [filteredPurchases]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Pembelian_${format(new Date(), 'yyyyMMdd')}`,
  });

  const handleExportExcel = () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const data = filteredPurchases.map((p: any) => ({
        'Tanggal': format(new Date(p.created_at), 'dd/MM/yyyy'),
        'Supplier': p.supplier_name || 'Umum',
        'Invoice': p.invoice_number || '-',
        'Perekam': p.profiles?.full_name || 'System',
        'Keterangan': p.description || '-',
        'Total (Rp)': Number(p.total_amount)
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Pembelian");

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

      XLSX.writeFile(wb, `Laporan_Pembelian_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Laporan Excel berhasil diunduh');
    } catch (error) {
      console.error('Export Excel Error:', error);
      toast.error('Gagal mengekspor data ke Excel');
    }
  };

  const handlePresetChange = (preset: string) => {
    setRangePreset(preset);
    const today = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'last7days':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'last30days':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case 'yesterday':
        setDateRange({ from: subDays(today, 1), to: subDays(today, 1) });
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-2">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">Laporan Pembelian</h1>
            <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Kelola data belanja stok dan biaya operasional.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border bg-card shadow-sm font-bold text-xs hover:bg-accent transition-all h-10 px-3"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="mr-2 h-3.5 w-3.5 text-primary" /> Preview
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-border bg-card shadow-sm font-bold text-xs hover:bg-accent transition-all h-10 px-3"
              onClick={handleExportExcel}
            >
              <TableIcon className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Export Excel
            </Button>
            <Button 
              variant="outline"
              className="rounded-xl border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm font-bold text-xs transition-all h-10 px-3"
              onClick={() => handlePrint()}
            >
              <FileText className="mr-2 h-3.5 w-3.5 text-red-500" /> Export PDF
            </Button>
            <Dialog open={isAddOpen || !!editingPurchase} onOpenChange={(open) => {
              if (open) {
                setIsAddOpen(true);
              } else {
                setIsAddOpen(false);
                setEditingPurchase(null);
                resetForm();
              }
            }}>
               <DialogTrigger asChild>
                  <Button className="gradient-primary text-white rounded-xl h-10 px-4 font-black shadow-sm transition-all">
                      <Plus className="mr-2 h-3.5 w-3.5" /> Catat Baru
                  </Button>
               </DialogTrigger>
               <DialogContent className="sm:rounded-3xl border-border bg-card p-0 overflow-hidden">
                  <DialogHeader className="bg-primary/5 p-6 border-b border-border/50">
                      <DialogTitle className="flex items-center gap-2 text-foreground uppercase tracking-widest font-black"><ShoppingCart className="h-5 w-5" /> {editingPurchase ? 'Edit Data' : 'Catat Belanja'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      
                      let finalCreatedAt = new Date().toISOString();
                      if (editingPurchase && formData.created_at === format(new Date(editingPurchase.created_at), 'yyyy-MM-dd')) {
                          finalCreatedAt = editingPurchase.created_at;
                      } else if (formData.created_at) {
                          const timePart = editingPurchase ? format(new Date(editingPurchase.created_at), 'HH:mm:ss') : format(new Date(), 'HH:mm:ss');
                          const localDate = new Date(`${formData.created_at}T${timePart}`);
                          finalCreatedAt = isNaN(localDate.getTime()) ? new Date().toISOString() : localDate.toISOString();
                      }

                      mutation.mutate({
                          supplier_name: formData.supplier_name,
                          total_amount: parseFloat(formData.total_amount),
                          invoice_number: formData.invoice_number,
                          description: formData.description,
                          created_at: finalCreatedAt
                      });
                  }} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tanggal</Label>
                              <Input type="date" value={formData.created_at} onChange={(e) => setFormData({...formData, created_at: e.target.value})} required className="rounded-2xl bg-secondary/50 h-12" />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Supplier</Label>
                              <Input value={formData.supplier_name} onChange={(e) => setFormData({...formData, supplier_name: e.target.value})} placeholder="Nama Supplier" required className="rounded-2xl bg-secondary/50 h-12" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total (Rp)</Label>
                              <Input type="number" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} placeholder="0" required className="rounded-2xl bg-secondary/50 h-12" />
                          </div>
                          <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">No. Invoice</Label>
                              <Input value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} placeholder="Opsional" className="rounded-2xl bg-secondary/50 h-12" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Keterangan</Label>
                          <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Detail belanja stok..." className="rounded-2xl bg-secondary/50 min-h-[100px]" />
                      </div>
                      <Button type="submit" className="w-full h-12 gradient-primary text-white font-black rounded-2xl shadow-xl" disabled={mutation.isPending}>
                          {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SIMPAN DATA'}
                      </Button>
                  </form>
               </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card p-3 rounded-2xl border border-border shadow-sm w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/50">
              {[
                { id: 'today', label: 'Hari Ini' },
                { id: 'yesterday', label: 'Kemarin' },
                { id: 'last7days', label: '7 Hari' },
                { id: 'last30days', label: '30 Hari' },
              ].map((p) => (
                <Button
                  key={p.id}
                  variant={rangePreset === p.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePresetChange(p.id)}
                  className={cn(
                    "rounded-lg h-8 font-bold px-3 transition-all text-[10px] sm:text-xs",
                    rangePreset === p.id ? "gradient-primary text-white shadow-md" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="hidden sm:block h-8 w-px bg-border mx-1" />

            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-xl border border-border/50 flex-1 sm:flex-none">
              <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-lg">
                <Label className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">Dari</Label>
                <Input 
                  type="date" 
                  className="h-7 w-full bg-transparent border-none font-bold text-[10px] sm:text-xs p-0 focus-visible:ring-0" 
                  value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : undefined;
                    setDateRange(prev => ({ ...prev, from: newDate }));
                    setRangePreset('custom');
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-background/50 rounded-lg">
                <Label className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">Sampai</Label>
                <Input 
                  type="date" 
                  className="h-7 w-full bg-transparent border-none font-bold text-[10px] sm:text-xs p-0 focus-visible:ring-0" 
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
        </div>
      </div>

      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-orange-500/10 rounded-3xl flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Pengeluaran Stok</p>
                  <p className="text-4xl font-black text-foreground">Rp {totalExpense.toLocaleString('id-ID')}</p>
              </div>
          </div>
          <div className="text-right bg-muted/40 px-6 py-4 rounded-3xl border border-border/50">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Periode Laporan</p>
              <p className="text-sm font-bold text-foreground">
                  {dateRange?.from ? format(dateRange.from, 'dd MMM') : '-'} s/d {dateRange?.to ? format(dateRange.to, 'dd MMM') : format(new Date(), 'dd MMM')}
              </p>
          </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari supplier atau no invoice..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-11 bg-card border-border shadow-sm rounded-xl h-11 text-sm font-semibold"
          />
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                      <TableHead className="py-5 px-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Tgl Beli</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Supplier</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Invoice</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Keterangan</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground text-right px-6">Total Nilai</TableHead>
                      <TableHead className="text-right px-6">Aksi</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredPurchases.map((p: any) => (
                      <TableRow key={p.id} className="group hover:bg-muted/30 transition-all border-b border-border/50">
                          <TableCell className="px-6 py-4 font-bold text-sm text-foreground">{format(new Date(p.created_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-black text-foreground capitalize">{p.supplier_name || 'Umum'}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground tracking-tighter uppercase">{p.invoice_number || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={p.description}>{p.description || '-'}</TableCell>
                          <TableCell className="text-right px-6 font-black text-orange-600">Rp {Number(p.total_amount).toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditClick(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteClick(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border bg-card p-0">
          <DialogHeader className="p-6 bg-primary/5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
            <DialogTitle className="flex justify-between items-center text-foreground">
              <span className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Eye className="h-5 w-5 text-primary" /> Pratinjau Laporan Pembelian</span>
              <Button onClick={() => handlePrint()} className="gradient-primary text-white rounded-xl h-10 px-6 font-black shadow-lg">
                <Printer className="mr-2 h-4 w-4" /> CETAK LAPORAN
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 bg-white text-black">
              <div className="text-center space-y-3 mb-10 pb-8 border-b-4 border-double border-gray-900">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Laporan Rekapitulasi Pembelian</h2>
                  <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Mulai: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</span>
                      <span>Sampai: {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
              </div>
              <div className="p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl mb-10 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Item Belanja</p>
                    <p className="text-2xl font-black">{filteredPurchases.length} Faktur</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Anggaran Keluar</p>
                    <p className="text-2xl font-black text-orange-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <table className="w-full mb-20 text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-900 text-left font-black uppercase tracking-widest">
                        <th className="py-4">Tgl</th>
                        <th className="py-4">Supplier</th>
                        <th className="py-4">Invoice</th>
                        <th className="py-4">Keterangan</th>
                        <th className="py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-gray-800">
                    {filteredPurchases.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100">
                            <td className="py-4">{format(new Date(p.created_at), 'dd/MM/yy')}</td>
                            <td className="py-4 uppercase">{p.supplier_name}</td>
                            <td className="py-4 font-mono">{p.invoice_number || '-'}</td>
                            <td className="py-4">{p.description || '-'}</td>
                            <td className="py-4 text-right">Rp {Number(p.total_amount).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-900 bg-gray-50">
                        <td colSpan={3} className="py-6 text-right font-black uppercase tracking-widest">GRAND TOTAL</td>
                        <td className="py-6 text-right font-black text-lg">Rp {totalExpense.toLocaleString('id-ID')}</td>
                    </tr>
                  </tfoot>
              </table>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
               <AlertCircle className="h-5 w-5" /> Hapus Data Pembelian?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data belanja dari <span className="font-bold text-foreground">{purchaseToDelete?.supplier_name || 'Umum'}</span> sebesar <span className="font-bold text-foreground">Rp {Number(purchaseToDelete?.total_amount || 0).toLocaleString('id-ID')}</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">BATALKAN</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => purchaseToDelete && deleteMutation.mutate(purchaseToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              HAPUS PERMANEN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Printable Content (Off-screen) */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <div className="p-12 bg-white text-black min-h-[1000px]" ref={printRef}>
              <div className="text-center space-y-3 mb-10 pb-8 border-b-4 border-double border-gray-900">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Laporan Rekapitulasi Pembelian</h2>
                  <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>Mulai: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</span>
                      <span>Sampai: {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                  </div>
              </div>
              <div className="p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl mb-10 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Item Belanja</p>
                    <p className="text-2xl font-black">{filteredPurchases.length} Faktur</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Anggaran Keluar</p>
                    <p className="text-2xl font-black text-orange-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <table className="w-full mb-20 text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-900 text-left font-black uppercase tracking-widest">
                        <th className="py-4">Tgl</th>
                        <th className="py-4">Supplier</th>
                        <th className="py-4">Invoice</th>
                        <th className="py-4">Keterangan</th>
                        <th className="py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-gray-800">
                    {filteredPurchases.map((p: any) => (
                        <tr key={p.id} className="border-b border-gray-100">
                            <td className="py-4">{format(new Date(p.created_at), 'dd/MM/yy')}</td>
                            <td className="py-4 uppercase">{p.supplier_name}</td>
                            <td className="py-4 font-mono">{p.invoice_number || '-'}</td>
                            <td className="py-4">{p.description || '-'}</td>
                            <td className="py-4 text-right">Rp {Number(p.total_amount).toLocaleString('id-ID')}</td>
                        </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-900 bg-gray-50">
                        <td colSpan={3} className="py-6 text-right font-black uppercase tracking-widest">GRAND TOTAL</td>
                        <td className="py-6 text-right font-black text-lg">Rp {totalExpense.toLocaleString('id-ID')}</td>
                    </tr>
                  </tfoot>
              </table>
          </div>
      </div>
    </div>
  );
}

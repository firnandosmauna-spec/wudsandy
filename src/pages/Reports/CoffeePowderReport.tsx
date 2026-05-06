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
  Loader2, 
  Search, 
  Calendar as CalendarIcon, 
  FileText, 
  ChevronDown,
  Eye,
  Printer,
  Table as TableIcon,
  Coffee,
  Package,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Save,
  Trash,
  AlertCircle
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange as DateRangeType } from "react-day-picker";
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

export default function CoffeePowderReport() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('thismonth');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    price: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Fetch Coffee Powder products for Add/Edit
  const { data: coffeeProducts = [] } = useQuery({
    queryKey: ['coffee_powder_products'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('id, name, price')
        .eq('category_id', COFFEE_POWDER_CATEGORY_ID);
      if (error) throw error;
      return data;
    }
  });

  const { data: coffeeSales = [], isLoading } = useQuery({
    queryKey: ['coffee_powder_sales', dateRange],
    queryFn: async () => {
      let query = (supabase as any)
        .from('transaction_items')
        .select(`
          *,
          products!inner(name, category_id),
          transactions!inner(created_at, status)
        `)
        .eq('products.category_id', COFFEE_POWDER_CATEGORY_ID)
        .eq('transactions.status', 'completed')
        .order('transactions(created_at)', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('transactions.created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('transactions.created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (item: any) => {
        const product = coffeeProducts.find(p => p.id === item.product_id);
        if (!product) throw new Error('Produk tidak ditemukan');

        const { data: transaction, error: tranError } = await (supabase as any)
            .from('transactions')
            .insert({
                total_amount: (item.price || product.price) * item.quantity,
                status: 'completed',
                payment_method: 'Tunai',
                created_at: new Date(item.date).toISOString()
            })
            .select()
            .single();
        
        if (tranError) throw tranError;

        const { error: itemError } = await (supabase as any)
            .from('transaction_items')
            .insert({
                transaction_id: transaction.id,
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                price: item.price || product.price
            });
        
        if (itemError) throw itemError;
        return transaction;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coffee_powder_sales'] });
        toast.success('Penjualan bubuk kopi berhasil dicatat');
        setIsAddOpen(false);
        setNewItem({ product_id: '', quantity: 1, price: 0, date: format(new Date(), 'yyyy-MM-dd') });
    },
    onError: (e: any) => toast.error('Gagal mencatat: ' + e.message)
  });

  const updateMutation = useMutation({
    mutationFn: async (item: any) => {
        const { error: itemError } = await (supabase as any)
            .from('transaction_items')
            .update({
                quantity: item.quantity,
                price: item.price
            })
            .eq('id', item.id);
        
        if (itemError) throw itemError;

        const { error: tranError } = await (supabase as any)
            .from('transactions')
            .update({
                total_amount: item.price * item.quantity
            })
            .eq('id', item.transaction_id);
        
        if (tranError) throw tranError;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coffee_powder_sales'] });
        toast.success('Data diperbarui');
        setIsEditOpen(false);
    },
    onError: (e: any) => toast.error('Gagal memperbarui: ' + e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
        const { error: itemError } = await (supabase as any)
            .from('transaction_items')
            .delete()
            .eq('id', item.id);
        
        if (itemError) throw itemError;

        const { error: tranError } = await (supabase as any)
            .from('transactions')
            .delete()
            .eq('id', item.transaction_id);
            
        if (tranError) throw tranError;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coffee_powder_sales'] });
        toast.success('Data dihapus');
        setIsDeleteOpen(false);
    },
    onError: (e: any) => toast.error('Gagal menghapus: ' + e.message)
  });

  const handleAddSale = () => {
    if (!newItem.product_id || newItem.quantity <= 0) {
      toast.error('Data tidak valid');
      return;
    }
    createMutation.mutate(newItem);
  };

  const handleEditSale = () => {
    if (!editingItem || editingItem.quantity <= 0) return;
    updateMutation.mutate(editingItem);
  };

  const openDeleteDialog = (item: any) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const filteredItems = useMemo(() => {
    return coffeeSales.filter((item: any) => 
      (item.product_name || item.products?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      item.transaction_id.toLowerCase().includes(search.toLowerCase())
    );
  }, [coffeeSales, search]);

  const totalQty = useMemo(() => {
    return filteredItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  }, [filteredItems]);

  const totalRevenue = useMemo(() => {
    return filteredItems.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
  }, [filteredItems]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Bubuk_Kopi_${format(new Date(), 'yyyyMMdd')}`,
  });

  const handleExportExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    try {
      const data = filteredItems.map((item: any) => ({
        'Tanggal': format(new Date(item.transactions.created_at), 'dd/MM/yyyy HH:mm'),
        'Nama Produk': item.product_name || item.products?.name || 'Produk',
        'Qty': item.quantity,
        'Harga Satuan': item.price,
        'Subtotal': item.quantity * item.price,
        'ID Transaksi': item.transaction_id.substring(0, 8).toUpperCase()
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Bubuk Kopi");

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

      XLSX.writeFile(wb, `Laporan_Bubuk_Kopi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
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
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'thismonth':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <Coffee className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Laporan Bubuk Kopi</h1>
                <p className="text-muted-foreground text-sm font-medium">Rekapitulasi penjualan produk kategori Bubuk Kopi.</p>
            </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white rounded-xl font-bold h-11">
                <Plus className="mr-2 h-4 w-4" /> Tambah Penjualan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Coffee className="h-5 w-5" /> Catat Penjualan Manual</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Pilih Produk</label>
                  <Select onValueChange={(v) => {
                    const p = coffeeProducts.find(x => x.id === v);
                    setNewItem({ ...newItem, product_id: v, price: p?.price || 0 });
                  }}>
                    <SelectTrigger className="rounded-xl border-border bg-secondary/50">
                      <SelectValue placeholder="Pilih Jenis Bubuk" />
                    </SelectTrigger>
                    <SelectContent>
                      {coffeeProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Jumlah (Qty)</label>
                    <Input 
                      type="number" 
                      className="rounded-xl border-border bg-secondary/50" 
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Harga (IDR)</label>
                    <Input 
                      type="number" 
                      className="rounded-xl border-border bg-secondary/50" 
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Tanggal</label>
                  <Input 
                    type="date" 
                    className="rounded-xl border-border bg-secondary/50" 
                    value={newItem.date}
                    onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full gradient-primary text-white rounded-xl h-12 font-black" onClick={handleAddSale} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  SIMPAN PENJUALAN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="rounded-xl border-border bg-card font-black h-11" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" className="rounded-xl border-border bg-card font-black h-11" onClick={handleExportExcel}>
            <TableIcon className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button 
            variant="outline"
            className="rounded-xl border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 hover:text-red-700 pos-shadow font-black h-11"
            onClick={() => handlePrint()}
          >
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="card-grid-responsive">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-6 group hover:border-primary/50 transition-all card-padding">
              <div className="h-14 w-14 md:h-16 md:w-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Unit Terjual</p>
                  <p className="text-3xl md:text-4xl font-black text-foreground">{totalQty.toLocaleString('id-ID')} <span className="text-sm font-bold text-muted-foreground">Pack</span></p>
              </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-6 group hover:border-emerald-500/50 transition-all card-padding">
              <div className="h-14 w-14 md:h-16 md:w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 md:h-8 md:w-8 text-emerald-500" />
              </div>
              <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Omzet Bubuk</p>
                  <p className="text-3xl md:text-4xl font-black text-emerald-600">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center justify-between card-padding">
              <div className="w-full">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Periode Laporan</p>
                <div className="text-xs md:text-sm font-bold text-foreground flex items-center justify-between">
                    <span>{dateRange?.from ? format(dateRange.from, 'dd MMM yyyy') : '-'}</span>
                    <span className="mx-2 text-muted-foreground uppercase text-[10px]">sd</span>
                    <span>{dateRange?.to ? format(dateRange.to, 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</span>
                </div>
              </div>
          </div>
      </div>

      <div className="bg-card p-6 rounded-3xl border border-border flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
            {['today', 'yesterday', 'thismonth'].map((p) => (
              <Button
                key={p}
                variant={rangePreset === p ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetChange(p)}
                className={cn(
                  "rounded-xl h-9 font-bold px-4",
                  rangePreset === p ? "gradient-primary text-white" : "hover:bg-accent"
                )}
              >
                {p === 'today' ? 'Hari Ini' : p === 'yesterday' ? 'Kemarin' : 'Bulan Ini'}
              </Button>
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={rangePreset === 'custom' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRangePreset('custom')}
                  className={cn(
                    "rounded-xl h-9 px-4 font-bold gap-2",
                    rangePreset === 'custom' && "gradient-primary text-white"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl border-border" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 flex items-center gap-3 bg-secondary/50 rounded-2xl h-12 px-4 ml-auto max-w-sm">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input 
                placeholder="Cari nama produk..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
          </div>
      </div>

      <div className="responsive-table-container">
          <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow>
                      <TableHead className="py-5 px-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Waktu Penjualan</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Produk Bubuk Kopi</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground text-center">Qty</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground text-right">Harga</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground text-right px-6">Subtotal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        Tidak ada penjualan bubuk kopi di periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item: any) => (
                      <TableRow key={item.id} className="group hover:bg-muted/30 transition-all border-b border-border/50">
                          <TableCell className="px-6 py-4">
                              <div className="text-sm font-bold text-foreground">
                                  {format(new Date(item.transactions.created_at), 'dd MMM yyyy', { locale: id })}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                  {format(new Date(item.transactions.created_at), 'HH:mm')} • {item.transaction_id.substring(0, 8).toUpperCase()}
                              </div>
                          </TableCell>
                          <TableCell className="font-black text-foreground">{item.product_name || item.products?.name || 'Produk'}</TableCell>
                          <TableCell className="text-center font-bold text-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium text-muted-foreground">Rp {item.price.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right px-6 font-black text-primary">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsEditOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => openDeleteDialog(item)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
               <Pencil className="h-5 w-5" /> Ubah Catatan Penjualan
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Nama Produk</p>
                <p className="text-sm font-bold text-blue-900">{editingItem.product_name || editingItem.products?.name || 'Produk'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Qty (Pack)</label>
                  <Input 
                    type="number" 
                    className="rounded-xl border-border bg-secondary/50 h-12"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground mr-1">Harga (IDR)</label>
                  <Input 
                    type="number" 
                    className="rounded-xl border-border bg-secondary/50 h-12"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-black" onClick={handleEditSale} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              SIMPAN PERUBAHAN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
               <AlertCircle className="h-5 w-5" /> Hapus Catatan Bubuk Kopi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus catatan item <span className="font-bold text-foreground">{itemToDelete?.products?.name}</span> dan transaksi terkait secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">BATALKAN</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}
              HAPUS PERMANEN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Printable Content (Off-screen) */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
        <div className="p-12 bg-white text-black min-h-[1000px]" ref={printRef}>
          <div className="text-center space-y-3 mb-10 pb-8 border-b-4 border-double border-gray-900">
             <h2 className="text-3xl font-black uppercase tracking-tighter">Laporan Penjualan Bubuk Kopi</h2>
             <div className="flex justify-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Mulai: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</span>
                <span>Sampai: {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Penjualan</p>
                  <p className="text-2xl font-black">{totalQty} Pack / Unit</p>
              </div>
              <div className="p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Nilai Penjualan</p>
                  <p className="text-2xl font-black text-emerald-600">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left font-black uppercase tracking-widest">
                <th className="py-4">Waktu</th>
                <th className="py-4">Produk</th>
                <th className="py-4 text-center">Qty</th>
                <th className="py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="font-bold text-gray-800">
              {filteredItems.map((item: any) => (
                 <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4">{format(new Date(item.transactions.created_at), 'dd/MM/yy HH:mm')}</td>
                    <td className="py-4 uppercase">{item.product_name || item.products?.name || 'Produk'}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                 </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="border-t-2 border-gray-900 bg-gray-50">
                  <td colSpan={3} className="py-6 text-right font-black uppercase tracking-widest">Grand Total Bubuk Kopi</td>
                  <td className="py-6 text-right font-black text-lg">Rp {totalRevenue.toLocaleString('id-ID')}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

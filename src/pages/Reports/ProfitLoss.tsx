import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart3,
  Calendar as CalendarIcon,
  Filter,
  ChevronDown,
  Eye,
  Printer,
  Download,
  Table as TableIcon
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Cell,
  Pie
} from 'recharts';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange as DateRangeType } from "react-day-picker";
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

export default function ProfitLoss() {
  const [dateRange, setDateRange] = useState<DateRangeType | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('thismonth');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

  // Fetch Sales
  const { data: sales = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales_report_pl', dateRange],
    queryFn: async () => {
      let query = (supabase as any)
        .from('transactions')
        .select('total_amount, created_at, transaction_items(price, quantity, products(category_id))')
        .order('created_at', { ascending: true });

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

  // Fetch Purchases
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases_report_pl', dateRange],
    queryFn: async () => {
      let query = (supabase as any)
        .from('purchases')
        .select('total_amount, created_at')
        .order('created_at', { ascending: true });

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

  const totalSales = useMemo(() => {
    return sales.reduce((sum, s) => {
      const bubukKopiTotal = (s.transaction_items || [])
        .filter((item: any) => item.products?.category_id === COFFEE_POWDER_CATEGORY_ID)
        .reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
      return sum + (Number(s.total_amount) - bubukKopiTotal);
    }, 0);
  }, [sales]);
  const totalPurchases = useMemo(() => purchases.reduce((sum, p) => sum + Number(p.total_amount), 0), [purchases]);
  const grossProfit = useMemo(() => totalSales - totalPurchases, [totalSales, totalPurchases]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_Laba_Rugi_${format(new Date(), 'yyyyMMdd')}`,
  });

  const handleExportExcel = () => {
    const data = [
      { 'Kategori': 'Pendapatan (Penjualan)', 'Jumlah (Rp)': totalSales },
      { 'Kategori': 'Pengeluaran (Belanja Stok)', 'Jumlah (Rp)': totalPurchases },
      { 'Kategori': 'Laba Kotor', 'Jumlah (Rp)': grossProfit },
      { 'Kategori': 'Margin Keuntungan (%)', 'Jumlah (%)': totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0 }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ringkasan Laba Rugi");
    XLSX.writeFile(wb, `Laporan_Laba_Rugi_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const handlePresetChange = (preset: string) => {
    setRangePreset(preset);
    const today = new Date();
    switch (preset) {
      case 'today': setDateRange({ from: today, to: today }); break;
      case 'thismonth': setDateRange({ from: startOfMonth(today), to: endOfMonth(today) }); break;
      // ...other presets possible
    }
  };

  // Process data for Chart
  const chartData = useMemo(() => {
    if (!sales || !purchases || !dateRange?.from || !dateRange?.to) return [];
    try {
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        const limitedDays = days.slice(-31);
        return limitedDays.map(day => {
          const daySales = sales.filter(s => isSameDay(new Date(s.created_at), day));
          const adjustedSValue = daySales.reduce((sum, s) => {
            const bubukKopiTotal = (s.transaction_items || [])
              .filter((item: any) => item.products?.category_id === COFFEE_POWDER_CATEGORY_ID)
              .reduce((itemSum: number, item: any) => itemSum + (item.price * item.quantity), 0);
            return sum + (Number(s.total_amount) - bubukKopiTotal);
          }, 0);
          
          const pValue = purchases.filter(p => isSameDay(new Date(p.created_at), day)).reduce((sum, p) => sum + Number(p.total_amount), 0);
          return { name: format(day, 'dd MMM'), Penjualan: adjustedSValue, Pembelian: pValue, Profit: adjustedSValue - pValue };
        });
    } catch (e) { return []; }
  }, [sales, purchases, dateRange]);

  const pieData = useMemo(() => [
    { name: 'Penjualan', value: totalSales, color: 'hsl(var(--primary))' },
    { name: 'Pembelian', value: totalPurchases, color: 'hsl(var(--destructive))' }
  ], [totalSales, totalPurchases]);

  if (isLoadingSales || isLoadingPurchases) {
    return (
        <div className="flex flex-col h-96 items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-black text-muted-foreground animate-pulse uppercase tracking-widest">Menghitung Profit...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-black uppercase tracking-tighter">Laporan Laba Rugi</h1>
          <p className="text-muted-foreground mt-1">Analisa performa keuangan dan keuntungan bisnis Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-border bg-card font-black h-11" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" className="rounded-xl border-border bg-card font-black h-11" onClick={handleExportExcel}>
            <TableIcon className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-3xl border-border bg-card shadow-sm group">
          <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pendapatan Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground group-hover:text-primary transition-colors">Rp {totalSales.toLocaleString('id-ID')}</div>
            <div className="mt-4 flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-lg w-fit"><TrendingUp className="mr-1 h-3 w-3" /> Total Sales</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card shadow-sm group">
          <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-500">Rp {totalPurchases.toLocaleString('id-ID')}</div>
            <div className="mt-4 flex items-center text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded-lg w-fit"><TrendingDown className="mr-1 h-3 w-3" /> Total Belanja</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border gradient-primary shadow-xl pos-shadow">
          <CardHeader className="pb-2">
             <CardTitle className="text-[10px] font-black text-primary-foreground/80 uppercase tracking-widest">Estimasi Dividen / Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary-foreground">Rp {grossProfit.toLocaleString('id-ID')}</div>
            <div className="mt-4 flex items-center text-[10px] font-black text-primary-foreground/90 uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg w-fit"><PieChartIcon className="mr-1 h-3 w-3" /> Rekap Periode</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm rounded-3xl p-6 h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid hsl(var(--border))' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px' }} />
                <Bar dataKey="Penjualan" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Pembelian" fill="hsl(var(--destructive))" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </Card>
        <Card className="border-border bg-card shadow-sm rounded-3xl p-6 h-[400px] flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '20px', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute flex flex-col items-center pointer-events-none">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Margin</p>
                <p className="text-3xl font-black">{totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0}%</p>
            </div>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl border-border bg-card p-0">
              <DialogHeader className="p-6 bg-primary/5 border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
                <DialogTitle className="flex justify-between items-center text-foreground uppercase tracking-widest font-black text-sm">
                    <span className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Preview Laba Rugi</span>
                    <Button onClick={() => handlePrint()} className="gradient-primary text-white rounded-xl h-10 px-6 font-black shadow-lg">
                        <Printer className="mr-2 h-4 w-4" /> CETAK LAPORAN
                    </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="p-16 bg-white text-black min-h-[1000px]" ref={printRef}>
                  <div className="text-center space-y-4 mb-16 pb-10 border-b-4 border-gray-900 border-double">
                      <h2 className="text-4xl font-black uppercase tracking-tighter">Laporan Laba Rugi Perusahaan</h2>
                      <div className="flex justify-center gap-6 text-sm font-bold text-gray-500 uppercase tracking-widest">
                          <span>Periode: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'} s/d {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                      </div>
                  </div>

                  <div className="space-y-10 uppercase font-black tracking-widest">
                      <div className="flex justify-between items-end border-b-2 border-gray-200 pb-4">
                          <span className="text-sm">TOTAL PENDAPATAN (SALES)</span>
                          <span className="text-xl text-gray-900">RP {totalSales.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-end border-b-2 border-gray-200 pb-4">
                          <span className="text-sm text-rose-500">TOTAL PENGELUARAN (COGS)</span>
                          <span className="text-xl text-rose-500">RP {totalPurchases.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-end bg-gray-900 text-white p-6 rounded-2xl">
                          <span className="text-lg">ESTIMASI LABA BERSIH</span>
                          <span className="text-3xl">RP {grossProfit.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-end border-t-2 border-gray-100 pt-4 text-xs text-gray-400">
                          <span>MARGIN PROFITABILITAS</span>
                          <span>{totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0}%</span>
                      </div>
                  </div>

                  <div className="mt-32 grid grid-cols-2 gap-24 px-10">
                      <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 mb-20 uppercase tracking-widest">Internal Auditor</p>
                          <div className="w-full border-b border-gray-300"></div>
                          <p className="text-[10px] font-black mt-2">PARAF & NAMA TERANG</p>
                      </div>
                      <div className="text-center">
                          <p className="text-xs font-bold text-gray-500 mb-20 uppercase tracking-widest">Direktur / Owner</p>
                          <div className="w-full border-b border-gray-900"></div>
                          <p className="text-[10px] font-black mt-2">CAP & TANDA TANGAN</p>
                      </div>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: config } = useStoreConfig();
  const storeName = config?.store_name || 'WUDkopi';
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('today');

  // Fetch Data
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['dashboard_transactions', dateRange],
    queryFn: async () => {
      let allData: any[] = [];
      let fromRow = 0;
      const batchSize = 1000;
      
      while (true) {
        let query = (supabase as any)
          .from('transactions')
          .select('*, transaction_items(*, products(category_id))')
          .order('created_at', { ascending: false })
          .range(fromRow, fromRow + batchSize - 1);

        if (dateRange?.from) {
          query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
        }
        if (dateRange?.to) {
          query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = allData.concat(data);
        if (data.length < batchSize) break;
        fromRow += batchSize;
      }
      return allData;
    }
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['dashboard_customers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['dashboard_products'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';

  // Filtering & Calculations
  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { stats: [], chartData: [], recent: [] };

    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);

    const periodTransactions = transactions.map((t: any) => {
      const bubukKopiTotal = (t.transaction_items || [])
        .filter((item: any) => item.products?.category_id === COFFEE_POWDER_CATEGORY_ID)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      return {
        ...t,
        adjustedTotal: Number(t.total_amount) - bubukKopiTotal
      };
    }).filter((t: any) => {
      const date = parseISO(t.created_at);
      return isWithinInterval(date, { start, end }) && t.adjustedTotal > 0;
    });

    const totalSales = periodTransactions.reduce((acc, t) => acc + (t.adjustedTotal || 0), 0);
    const totalTransactions = periodTransactions.length;
    
    const newCustomers = customers.filter(c => {
      const date = parseISO(c.created_at);
      return isWithinInterval(date, { start, end });
    }).length;

    const lowStockCount = products.filter(p => (p.stock || 0) <= 10).length;

    // Chart Data (Group by date)
    const dailyData: Record<string, number> = {};
    periodTransactions.forEach(t => {
      const day = format(parseISO(t.created_at), 'dd MMM', { locale: id });
      dailyData[day] = (dailyData[day] || 0) + (t.adjustedTotal || 0);
    });

    const chartData = Object.entries(dailyData).map(([name, sales]) => ({ name, sales }));

    return {
      stats: [
        {
          title: "Total Penjualan",
          value: `Rp ${totalSales.toLocaleString('id-ID')}`,
          icon: TrendingUp,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10"
        },
        {
          title: "Total Transaksi",
          value: totalTransactions.toString(),
          icon: ShoppingCart,
          color: "text-blue-500",
          bg: "bg-blue-500/10"
        },
        {
          title: "Pelanggan Baru",
          value: newCustomers.toString(),
          icon: Users,
          color: "text-orange-500",
          bg: "bg-orange-500/10"
        },
        {
          title: "Stok Menipis (<10)",
          value: lowStockCount.toString(),
          icon: Package,
          color: "text-rose-500",
          bg: "bg-rose-500/10"
        }
      ],
      chartData,
      recent: periodTransactions.slice(0, 5)
    };
  }, [transactions, customers, products, dateRange]);

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
      case 'last30days':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
    }
  };

  const isLoading = isLoadingTransactions || isLoadingCustomers || isLoadingProducts;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">Dashboard</h1>
          <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Perform Real-time {storeName}</p>
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

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Menghitung statistik...</p>
            </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="card-grid-responsive">
            {filteredData.stats.map((stat, index) => (
              <Card key={index} className="border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden group hover:border-primary/30 transition-all shadow-sm card-padding">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-4">
                  <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("p-2 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4 md:h-5 md:w-5", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stat.value}</div>
                  <div className="flex items-center mt-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40">
                    <Activity className="h-3 w-3 mr-1.5" /> Live
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="bg-primary/5 border-b border-border/50 card-padding py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tren Penjualan</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] md:h-[380px] pt-6 md:pt-10 px-2 md:px-6">
                {filteredData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData.chartData}>
                        <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                        />
                        <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1)+'jt' : val.toLocaleString('id-ID')}`}
                        />
                        <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '16px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                        }} 
                        formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Penjualan']}
                        />
                        <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        strokeWidth={3}
                        animationDuration={1500}
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground italic">
                        Tidak ada data transaksi di rentang tanggal ini.
                    </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3 border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="bg-secondary/30 border-b border-border/50 card-padding py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Aktivitas Terakhir
                  <Activity className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="card-padding py-4">
                <div className="space-y-5">
                  {filteredData.recent.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground italic text-sm">Belum ada transaksi tercatat.</div>
                  ) : filteredData.recent.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 group">
                      <div className="h-11 w-11 rounded-2xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="text-sm font-bold text-foreground truncate">INV-{t.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(t.created_at), 'HH:mm • dd MMM yyyy', { locale: id })}
                        </p>
                      </div>
                      <div className="text-sm font-black text-emerald-500">
                        +Rp {(t.adjustedTotal || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-6 rounded-xl text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                  onClick={() => navigate('/transactions')}
                >
                    Lihat Semua Transaksi
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: config } = useStoreConfig();
  const storeName = config?.store_name || 'WUDkopi';
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });
  const [rangePreset, setRangePreset] = useState<string>('thisMonth');

  // Fetch Data
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['dashboard_transactions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('transactions')
        .select('*, transaction_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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

  // Filtering & Calculations
  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { stats: [], chartData: [], recent: [] };

    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);

    const periodTransactions = transactions.filter(t => {
      const date = parseISO(t.created_at);
      return isWithinInterval(date, { start, end });
    });

    const totalSales = periodTransactions.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);
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
      dailyData[day] = (dailyData[day] || 0) + (Number(t.total_amount) || 0);
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
      case 'last7Days':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
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

        <div className="flex flex-wrap items-center gap-1.5 bg-card/30 p-1 rounded-2xl border border-border/50">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'last7Days', label: '7 Hari' },
            { id: 'thisMonth', label: 'Bulan Ini' },
          ].map((p) => (
            <Button
              key={p.id}
              variant={rangePreset === p.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePresetChange(p.id)}
              className={cn(
                "rounded-xl h-9 font-semibold transition-all",
                rangePreset === p.id ? "gradient-primary shadow-sm" : "hover:bg-accent"
              )}
            >
              {p.label}
            </Button>
          ))}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={rangePreset === 'custom' ? "default" : "outline"}
                size="sm"
                onClick={() => setRangePreset('custom')}
                className={cn(
                  "rounded-xl h-9 border-border/60 font-semibold gap-2",
                  rangePreset === 'custom' && "gradient-primary border-none"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM", { locale: id })} - {format(dateRange.to, "dd MMM", { locale: id })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM", { locale: id })
                  )
                ) : (
                  <span>Pilih Tanggal</span>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
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
                        +Rp {Number(t.total_amount).toLocaleString('id-ID')}
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

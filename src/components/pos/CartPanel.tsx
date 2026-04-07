import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { supabase } from '@/integrations/supabase/client';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Wallet, Banknote, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export function CartPanel() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [manualReceiptNumber, setManualReceiptNumber] = useState('');
  const { data: storeConfig } = useStoreConfig();

  // Fetch Customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch active shift
  const { data: activeShift, isLoading: isLoadingShift } = useQuery({
    queryKey: ['active_shift', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cash_registers')
        .select('*')
        .eq('status', 'open')
        .eq('user_id', user?.id)
        .order('opening_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch branch if needed (usually from shift or store config)
  useEffect(() => {
    if (activeShift?.branch_id) {
        setBranchId(activeShift.branch_id);
    }
  }, [activeShift]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!activeShift) {
        toast.error('Shift belum dibuka', { 
            description: 'Silakan buka shift kasir terlebih dahulu di menu Shift Kasir.' 
        });
        return;
    }

    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setProcessing(true);

    try {
      // 0. Resolve Receipt Number
      let finalReceiptNumber = '';
      if (storeConfig?.transaction_id_mode === 'manual') {
          if (!manualReceiptNumber.trim()) {
              toast.error('Nomor struk manual wajib diisi');
              setProcessing(false);
              return;
          }
          finalReceiptNumber = manualReceiptNumber.trim();
      } else {
          const prefix = storeConfig?.transaction_prefix || 'TRX';
          const datePart = format(new Date(), 'yyyyMMdd');
          const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
          finalReceiptNumber = `${prefix}-${datePart}-${randomPart}`;
      }

      // 1. Create Transaction
      const { data: transaction, error: transError } = await (supabase as any)
        .from('transactions')
        .insert({
          user_id: user.id,
          total_amount: total,
          payment_method: paymentMethod,
          status: 'completed',
          cash_register_id: activeShift.id,
          customer_id: customerId,
          branch_id: branchId,
          receipt_number: finalReceiptNumber
        })
        .select()
        .single();

      if (transError) throw transError;

      // 2. Create Transaction Items
      const transactionItems = items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await (supabase as any)
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // 3. Update Cash Register Total Sales (Exclude BUBUK KOPI)
      if (paymentMethod === 'Tunai') {
          const COFFEE_POWDER_CATEGORY_ID = 'ccde4373-c563-4339-b0fe-efa2ef007129';
          const bubukKopiTotal = items
            .filter(item => item.product.category_id === COFFEE_POWDER_CATEGORY_ID)
            .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          
          const adjustedTotal = total - bubukKopiTotal;
          
          if (adjustedTotal > 0) {
              const { error: shiftError } = await (supabase as any)
                .from('cash_registers')
                .update({ 
                    total_sales: (activeShift.total_sales || 0) + adjustedTotal,
                    expected_balance: (activeShift.expected_balance || 0) + adjustedTotal
                })
                .eq('id', activeShift.id);
              
              if (shiftError) console.error('Failed to update shift total', shiftError);
          }
      }

      clearCart();
      setManualReceiptNumber('');
      toast.success('Pembayaran berhasil!', {
        description: `No: ${finalReceiptNumber} • Total: ${formatPrice(total)}`,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Gagal memproses pembayaran', { description: error.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <ShoppingBag className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">Keranjang</h2>
            <p className="text-sm text-muted-foreground">{itemCount} item</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Keranjang kosong</p>
            <p className="text-muted-foreground text-xs mt-1">Tap produk untuk menambahkan</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-3 rounded-xl bg-secondary/50 p-3 animate-fade-in"
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">🍽️</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-primary font-semibold text-sm">
                    {formatPrice(item.product.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-4">
        <div className="space-y-4">
          {storeConfig?.transaction_id_mode === 'manual' && (
            <div className="space-y-2 pb-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 overflow-hidden">
                <Hash className="h-3 w-3 text-primary" /> Nomor Struk (Manual)
              </label>
              <Input 
                placeholder="Masukkan No. Struk..."
                value={manualReceiptNumber}
                onChange={(e) => setManualReceiptNumber(e.target.value)}
                className="bg-secondary/50 border-border rounded-xl h-11 font-bold text-sm focus:bg-background transition-all"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pelanggan</label>
              <Select value={customerId || "walk-in"} onValueChange={(v) => setCustomerId(v === "walk-in" ? null : v)}>
                <SelectTrigger className="w-full bg-secondary border-border rounded-xl h-11">
                  <SelectValue placeholder="Walk-in Customer" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="walk-in">Umum (Walk-in)</SelectItem>
                  {customers?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pembayaran</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full bg-secondary border-border rounded-xl h-11">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak (0%)</span>
              <span className="text-foreground">{formatPrice(0)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total Penjualan</span>
              <span className="font-black text-xl text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={items.length === 0 || processing}
          className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <CreditCard className="mr-2 h-5 w-5" />
          {processing ? 'Memproses...' : 'Bayar Sekarang'}
        </Button>
      </div>
    </div>
  );
}

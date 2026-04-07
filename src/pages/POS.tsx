import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/pos/Header';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

export default function POS() {
  const { user, loading } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const { itemCount } = useCart();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Product Area */}
        <main className="flex-1 overflow-hidden">
          <ProductGrid />
        </main>

        {/* Cart Panel - Desktop */}
        <aside className="hidden lg:block w-[360px]">
          <CartPanel />
        </aside>

        {/* Cart Panel - Mobile Overlay */}
        <div
          className={cn(
            'fixed inset-0 z-50 lg:hidden transition-all duration-300',
            showCart ? 'visible' : 'invisible'
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity',
              showCart ? 'opacity-100' : 'opacity-0'
            )}
            onClick={() => setShowCart(false)}
          />
          <div
            className={cn(
              'absolute right-0 top-0 h-full w-full max-w-md transform transition-transform duration-300 ease-out',
              showCart ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            <div className="relative h-full">
              <button
                onClick={() => setShowCart(false)}
                className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <CartPanel />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg pos-shadow lg:hidden animate-pulse-glow"
      >
        <ShoppingCart className="h-6 w-6 text-primary-foreground" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
    </div>
  );
}

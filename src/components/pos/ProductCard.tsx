import { memo } from 'react';
import { Product } from '@/types/pos';
import { useCartActions } from '@/hooks/useCart';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartActions();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <button
      onClick={() => addItem(product)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border p-3 text-left transition-all duration-300 card-hover cursor-pointer"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full gradient-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75 shadow-lg">
          <Plus className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="mt-auto font-bold text-primary text-base">
          {formatPrice(product.price)}
        </p>
      </div>
    </button>
  );
});

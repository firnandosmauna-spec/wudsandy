import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/pos';
import { ProductCard } from './ProductCard';
import { CategoryFilter } from './CategoryFilter';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, debouncedSearch]);

  const isLoading = isLoadingProducts || isLoadingCategories;

  if (isLoading && products.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 lg:p-6">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-secondary border-border rounded-xl text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Categories */}
      <div className="mb-4">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>{isLoading ? 'Memuat produk...' : 'Tidak ada produk ditemukan'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

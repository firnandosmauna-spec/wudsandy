import { useState } from 'react';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Package, 
  Search, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Products() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category_id: ''
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch Products with Categories
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch Categories for Selection
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Create Product
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('products')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddOpen(false);
      resetForm();
      toast.success('Produk berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error('Gagal menambahkan produk', { description: error.message });
    }
  });

  // Update Product
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      resetForm();
      toast.success('Produk berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error('Gagal memperbarui produk', { description: error.message });
    }
  });

  // Delete Product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus produk', { description: error.message });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', price: '', stock: '0', category_id: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock || '0'),
      category_id: formData.category_id || null
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kelola Produk</h1>
          <p className="text-muted-foreground mt-1">Daftar semua produk dan pengaturan harga.</p>
        </div>
        <Dialog open={isAddOpen || !!editingProduct} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} className="gradient-primary text-primary-foreground font-semibold rounded-xl pos-shadow">
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(val) => setFormData({...formData, category_id: val})}
                >
                  <SelectTrigger className="bg-secondary border-border rounded-xl h-11">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama produk..." 
            className="pl-10 bg-background border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border rounded-xl h-10">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingProducts ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Tidak ada produk ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="font-semibold text-foreground truncate max-w-[200px]">
                        {p.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {p.categories?.name || 'Tanpa Kategori'}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    Rp {p.price.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={() => {
                          setEditingProduct(p);
                          setFormData({
                            name: p.name,
                            price: p.price.toString(),
                            stock: (p.stock || 0).toString(),
                            category_id: p.category_id || ''
                          });
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                            deleteMutation.mutate(p.id);
                          }
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
    </div>
  );
}

// Simple cn helper for standard tailwind merging inside component
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

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
import { Plus, Edit2, Trash2, Loader2, Tags, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Categories() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Fetch Categories
  const { data: categories, isLoading } = useQuery({
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

  // Create Category
  const createMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newName }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddOpen(false);
      setName('');
      toast.success('Kategori berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error('Gagal menambahkan kategori', { description: error.message });
    }
  });

  // Update Category
  const updateMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string, newName: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      setName('');
      toast.success('Kategori berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error('Gagal memperbarui kategori', { description: error.message });
    }
  });

  // Delete Category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus kategori', { description: error.message });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, newName: name });
    } else {
      createMutation.mutate(name);
    }
  };

  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kelola Kategori</h1>
          <p className="text-muted-foreground mt-1">Atur kategori produk untuk memudahkan pencarian di POS.</p>
        </div>
        <Dialog open={isAddOpen || !!editingCategory} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingCategory(null);
            setName('');
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} className="gradient-primary text-primary-foreground font-semibold rounded-xl pos-shadow">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Makanan, Minuman, Snak"
                  required
                  className="bg-secondary border-border rounded-xl h-11"
                />
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
                    editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari kategori..." 
            className="pl-10 bg-background border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">No.</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Dibuat Pada</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredCategories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Tidak ada kategori ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories?.map((cat, index) => (
                <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tags className="h-4 w-4 text-primary" />
                      </div>
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(cat.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={() => {
                          setEditingCategory(cat);
                          setName(cat.name);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
                            deleteMutation.mutate(cat.id);
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

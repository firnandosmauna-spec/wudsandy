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
import * as XLSX from 'xlsx';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Products() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    capital_price: '',
    stock: '',
    category_id: '',
    image_url: ''
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
    setFormData({ name: '', price: '', capital_price: '', stock: '0', category_id: '', image_url: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      capital_price: parseFloat(formData.capital_price || '0'),
      stock: parseInt(formData.stock || '0'),
      category_id: formData.category_id || null,
      image_url: formData.image_url || null
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('File kosong atau format tidak valid');
          return;
        }

        toast.info(`Memproses ${jsonData.length} produk...`);

        // Prepare data for upsert
        const productsToUpsert = jsonData.map(row => ({
          name: row.Nama || row.name || 'Produk Baru',
          price: parseFloat(row.Harga || row.price || 0),
          capital_price: parseFloat(row.HargaModal || row.capital_price || 0),
          stock: parseInt(row.Stok || row.stock || 0),
          category_id: row.KategoriID || row.category_id || null,
          image_url: row.Gambar || row.image_url || null,
          description: row.Deskripsi || row.description || ''
        }));

        const { error } = await supabase
          .from('products')
          .upsert(productsToUpsert, { onConflict: 'name' });

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success(`Berhasil mengimpor ${productsToUpsert.length} produk!`);
      } catch (err: any) {
        toast.error('Gagal mengimpor: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      { Nama: 'Nama Produk Contoh', Harga: 15000, HargaModal: 10000, Stok: 100, KategoriID: '', Gambar: '', Deskripsi: 'Deskripsi singkat' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-produk.xlsx");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#5d4037] uppercase tracking-tight">Kelola Produk</h1>
          <p className="text-[#ec4899] mt-1 font-bold text-xs uppercase tracking-widest">Daftar semua produk dan pengaturan harga.</p>
        </div>
        <Dialog open={isAddOpen || !!editingProduct} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="rounded-xl border-pink-100 hover:bg-pink-50 gap-2 hidden sm:flex text-[#5d4037]"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('product-upload')?.click()}
              className="rounded-xl border-pink-100 hover:bg-pink-50 gap-2 text-[#5d4037]"
            >
              <Upload className="h-4 w-4" />
              Impor
              <input 
                id="product-upload" 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </Button>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddOpen(true)} className="bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold rounded-xl shadow-lg shadow-pink-100">
                <Plus className="mr-2 h-4 w-4" /> Tambah Produk
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="sm:max-w-[425px] bg-white border-pink-100">
            <DialogHeader>
              <DialogTitle className="text-[#5d4037] font-black uppercase">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Nama Produk</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="bg-white border-pink-100 rounded-xl h-11 text-[#5d4037]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capital_price" className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Harga Modal (Rp)</Label>
                  <Input
                    id="capital_price"
                    type="number"
                    value={formData.capital_price}
                    onChange={(e) => setFormData({...formData, capital_price: e.target.value})}
                    required
                    className="bg-white border-pink-100 rounded-xl h-11 text-[#5d4037]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Harga Jual (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                    className="bg-white border-pink-100 rounded-xl h-11 text-[#5d4037]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Kategori</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(val) => setFormData({...formData, category_id: val})}
                >
                  <SelectTrigger className="bg-white border-pink-100 rounded-xl h-11 text-[#5d4037]">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-pink-100">
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-[#ec4899] font-bold text-[10px] uppercase tracking-widest">Foto Produk</Label>
                <div className="flex flex-col gap-4">
                  <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="h-40 w-full rounded-2xl border-2 border-dashed border-pink-100 bg-[#f0f9f1] flex items-center justify-center overflow-hidden relative group cursor-pointer hover:bg-pink-50 transition-colors"
                  >
                    {formData.image_url ? (
                      <>
                        <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Hapus foto ini?')) {
                                setFormData({...formData, image_url: ''});
                                toast.success('Foto dihapus dari formulir');
                              }
                            }}
                            className="rounded-xl h-10 bg-white text-rose-500 hover:bg-rose-50 font-bold px-4 gap-2 shadow-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus Foto
                          </Button>
                          <p className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-md">Klik area lain untuk ganti</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[#5d4037] opacity-20 group-hover:opacity-60 transition-opacity text-center px-4">
                        <Upload className="h-8 w-8" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Klik di sini untuk Upload Foto</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden" // Hide the original ugly input
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        toast.info('Sedang mengunggah gambar...');
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('store-logos')
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                          .from('store-logos')
                          .getPublicUrl(filePath);

                        setFormData({ ...formData, image_url: publicUrl });
                        toast.success('Gambar berhasil diunggah');
                      } catch (error: any) {
                        toast.error('Gagal mengunggah gambar', { description: error.message });
                      }
                    }}
                    className="bg-white border-pink-100 rounded-xl text-[#5d4037]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-[#ec4899] hover:bg-[#db2777] text-white h-12 rounded-xl font-bold"
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
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ec4899]" />
          <Input 
            placeholder="Cari nama produk..." 
            className="pl-10 bg-white border-pink-100 rounded-xl text-[#5d4037]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#ec4899]" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white border-pink-100 rounded-xl h-10 text-[#5d4037]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent className="bg-white border-pink-100">
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#f0f9f1]">
            <TableRow className="border-pink-50 hover:bg-transparent">
              <TableHead className="text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Produk</TableHead>
              <TableHead className="text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Kategori</TableHead>
              <TableHead className="text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Stok</TableHead>
              <TableHead className="text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Harga Modal</TableHead>
              <TableHead className="text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Harga Jual</TableHead>
              <TableHead className="text-right text-[#ec4899] font-black uppercase text-[10px] tracking-widest">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingProducts ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ec4899]" />
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-[#5d4037] opacity-40 font-bold">
                  Tidak ada produk ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((p) => (
                <TableRow key={p.id} className="border-pink-50 hover:bg-[#f0f9f1]/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#f0f9f1] flex items-center justify-center shrink-0 border border-pink-100">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <Package className="h-5 w-5 text-[#ec4899] opacity-40" />
                        )}
                      </div>
                      <div className="font-bold text-[#5d4037] truncate max-w-[200px]">
                        {p.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center rounded-lg bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-[#ec4899]">
                      {p.categories?.name || 'Tanpa Kategori'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "font-black text-sm",
                      (p.stock || 0) <= 5 ? "text-rose-500 animate-pulse" : "text-[#5d4037]"
                    )}>
                      {p.stock || 0}
                      {(p.stock || 0) <= 5 && <span className="ml-2 text-[8px] uppercase tracking-tighter bg-rose-100 px-1.5 py-0.5 rounded">Low</span>}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-[#5d4037]">
                    Rp {p.capital_price ? p.capital_price.toLocaleString('id-ID') : '0'}
                  </TableCell>
                  <TableCell className="font-bold text-[#5d4037]">
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
                            capital_price: (p.capital_price || 0).toString(),
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

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
import { Plus, Edit2, Trash2, Loader2, Users, Search, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Fetch Customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', editingCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setEditingCustomer(null);
      resetForm();
      toast.success(editingCustomer ? 'Data pelanggan diperbarui' : 'Pelanggan berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error('Gagal menyimpan data pelanggan', { description: error.message });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Pelanggan berhasil dihapus');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daftar Pelanggan</h1>
          <p className="text-muted-foreground mt-1">Kelola data pelanggan untuk program loyalitas dan riwayat belanja.</p>
        </div>
        <Dialog open={isAddOpen || !!editingCustomer} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingCustomer(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} className="gradient-primary text-primary-foreground font-semibold rounded-xl pos-shadow">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Pelanggan' : 'Daftar Pelanggan Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Ahmad Subardjo"
                  required
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="0812xxxxxxxx"
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Opsional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@pelanggan.com"
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Alamat lengkap"
                  className="bg-secondary border-border rounded-xl h-11"
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Data'}
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
            placeholder="Cari nama, tlp, atau email..." 
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
              <TableHead>Nama Pelanggan</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Alamat</TableHead>
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
            ) : filteredCustomers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Belum ada data pelanggan.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers?.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Dibuat: {format(new Date(c.created_at), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {c.phone && <div className="flex items-center gap-2 text-sm text-foreground"><Phone className="h-3 w-3 text-muted-foreground" /> {c.phone}</div>}
                      {c.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3 w-3" /> {c.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-foreground max-w-[200px] truncate">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      {c.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={() => {
                          setEditingCustomer(c);
                          setFormData({
                            name: c.name,
                            phone: c.phone || '',
                            email: c.email || '',
                            address: c.address || ''
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
                          if (confirm('Hapus data pelanggan ini?')) {
                            deleteMutation.mutate(c.id);
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

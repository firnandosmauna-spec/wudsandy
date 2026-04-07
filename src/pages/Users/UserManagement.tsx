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
import { UserPlus, UserCircle, Shield, Trash2, Loader2, Search, Mail, Lock, User, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function UserManagement() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'cashier'
  });
  
  const queryClient = useQueryClient();

  // Fetch Users (Profiles)
  const { data: users, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role
          }
        }
      });
      if (error) throw error;
      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsAddOpen(false);
      resetForm();
      toast.success('Pengguna berhasil didaftarkan. Harap verifikasi email jika diaktifkan.');
    },
    onError: (error: any) => {
      toast.error('Gagal mendaftarkan pengguna', { description: error.message });
    }
  });

  // Delete User Mutation (Profile only, auth deletion usually requires admin SDK)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('profiles') as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Akses profil pengguna dihapus');
    },
    onError: (error: any) => {
        toast.error('Gagal menghapus profil', { description: 'Pengguna mungkin memiliki data transaksi terkait.' });
    }
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '', role: 'cashier' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredUsers = (users as any[])?.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kelola Pengguna</h1>
          <p className="text-muted-foreground mt-1">Atur hak akses karyawan dan administrator sistem.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-semibold rounded-xl pos-shadow">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Karyawan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Daftarkan Pengguna Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Nama Karyawan"
                    required
                    className="pl-10 bg-secondary border-border rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Login</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@toko.com"
                    required
                    className="pl-10 bg-secondary border-border rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimal 6 karakter"
                    required
                    className="pl-10 bg-secondary border-border rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Peran (Role)</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({...formData, role: val})}
                >
                  <SelectTrigger className="bg-secondary border-border rounded-xl h-11">
                    <SelectValue placeholder="Pilih Peran" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="cashier">Kasir (Transaksi)</SelectItem>
                    <SelectItem value="admin">Administrator (Penuh)</SelectItem>
                    <SelectItem value="waiter">Pelayan (Hanya list)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Daftar Sekarang</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama atau email..." 
            className="pl-10 bg-background border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-[150px] bg-muted animate-pulse rounded-2xl" />
          ))
        ) : filteredUsers?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card border border-dashed border-border rounded-2xl">
            <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Tidak ada pengguna ditemukan.</p>
          </div>
        ) : (
          filteredUsers?.map((user) => (
            <div key={user.id} className="group relative bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl">
                  {user.full_name ? user.full_name[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{user.full_name || 'Tanpa Nama'}</h3>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                    user.role === 'admin' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                )}>
                  {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
                  {user.role}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Dibuat: {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-'}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => {
                        if (confirm('Apakah Anda yakin ingin menghapus profil pengguna ini?')) {
                            deleteMutation.mutate(user.id);
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
import { UserPlus, UserCircle, Shield, Trash2, Loader2, Search, Mail, Lock, User, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function WebUserManagement() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'web_admin'
  });
  
  const queryClient = useQueryClient();

  // Fetch Web Users (Profiles with role web_admin)
  const { data: users, isLoading } = useQuery({
    queryKey: ['profiles', 'web_users'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .in('role', ['web_admin', 'web_manager'])
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
      toast.success('Admin Web berhasil didaftarkan.');
    },
    onError: (error: any) => {
      toast.error('Gagal mendaftarkan admin', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('profiles') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Akses admin web dihapus');
    }
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '', role: 'web_admin' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredUsers = (users as any[])?.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#5d4037] uppercase tracking-tight">Admin Web Toko</h2>
          <p className="text-[#ec4899] text-xs font-bold uppercase tracking-widest">Pengguna khusus pengelola tampilan website</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#ec4899] hover:bg-[#db2777] text-white rounded-xl shadow-lg shadow-pink-100">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Admin Web
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-pink-100">
            <DialogHeader>
              <DialogTitle className="text-[#5d4037] font-black uppercase">Admin Web Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-[#5d4037] font-bold">Nama Lengkap</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-[#f0f9f1] border-pink-100 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#5d4037] font-bold">Email Login</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-[#f0f9f1] border-pink-100 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#5d4037] font-bold">Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-[#f0f9f1] border-pink-100 rounded-xl"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#ec4899] h-12 rounded-xl font-black" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'DAFTARKAN ADMIN'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : filteredUsers?.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-pink-100">
            <Globe className="h-12 w-12 text-pink-200 mx-auto mb-4" />
            <p className="text-[#5d4037] font-bold opacity-40">Belum ada admin web khusus.</p>
          </div>
        ) : (
          filteredUsers?.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pink-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-[#ec4899] font-black">
                  {u.full_name?.[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[#5d4037]">{u.full_name}</div>
                  <div className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="px-3 py-1 rounded-full bg-[#f0f9f1] text-[#ec4899] text-[9px] font-black uppercase tracking-widest border border-pink-100">
                    {u.role}
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(u.id)} className="text-pink-200 hover:text-rose-500">
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

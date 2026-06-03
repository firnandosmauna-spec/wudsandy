import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { data: config } = useStoreConfig();
  const navigate = useNavigate();

  const storeName = config?.store_name || 'WUDkopi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);
        if (error) {
          toast.error('Login gagal', { description: error.message });
        } else {
          toast.success('Selamat Datang!', { description: 'Berhasil masuk ke sistem.' });
          
          // Check role and redirect
          if (data?.user?.user_metadata?.role === 'web_admin') {
            navigate('/landing-admin');
          } else {
            navigate('/home');
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error('Registrasi gagal', { description: error.message });
        } else {
          toast.success('Registrasi berhasil!', {
            description: 'Silakan cek email untuk verifikasi akun.',
          });
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f9f1] p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white border-2 border-primary/20 shadow-xl overflow-hidden group hover:scale-110 transition-transform duration-500">
            <img 
               src={config?.logo_url || "/wudkopi-logo.png"} 
               alt={storeName} 
               className="h-full w-full object-cover" 
               onError={(e) => {
                 const target = e.target as HTMLImageElement;
                 if (!target.src.includes('wudkopi-logo.png')) {
                   target.src = "/wudkopi-logo.png";
                 }
               }}
            />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter leading-none">{storeName}</h1>
            <p className="mt-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-70">Admin System</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-[2.5rem] border-2 border-pink-100 bg-white p-8 md:p-10 shadow-2xl shadow-pink-100/30 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-4xl select-none">🍩</div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#5d4037] uppercase tracking-tight">
              {isLogin ? 'Selamat Datang' : 'Bergabunglah'}
            </h2>
            <p className="text-xs font-bold text-[#ec4899] uppercase tracking-widest mt-1 opacity-60">
              {isLogin
                ? 'Silakan masuk ke akun Anda'
                : 'Buat akun baru untuk mulai'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#5d4037]/60 ml-1">
                Alamat Email
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl drop-shadow-sm group-focus-within:scale-110 transition-transform">📧</div>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-14 bg-[#f0f9f1]/50 border-pink-100 rounded-2xl focus:ring-[#ec4899] focus:border-[#ec4899] font-bold text-[#5d4037]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-[#5d4037]/60 ml-1">
                Kata Sandi
              </Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl drop-shadow-sm group-focus-within:scale-110 transition-transform">🔒</div>
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-12 h-14 bg-[#f0f9f1]/50 border-pink-100 rounded-2xl focus:ring-[#ec4899] focus:border-[#ec4899] font-bold text-[#5d4037]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#ec4899] hover:bg-[#db2777] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isLogin ? (
                'Masuk Sekarang'
              ) : (
                'Daftar Akun'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              {isLogin ? 'Belum punya akun? Daftar Baru' : 'Sudah punya akun? Masuk Saja'}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
          {storeName} Admin Ecosystem • v2.0.0
        </p>
      </div>
    </div>
  );
}

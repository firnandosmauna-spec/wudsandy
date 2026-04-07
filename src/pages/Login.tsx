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
        const { error } = await signIn(email, password);
        if (error) {
          toast.error('Login gagal', { description: error.message });
        } else {
          toast.success('Login berhasil!');
          navigate('/');
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border overflow-hidden pos-shadow animate-pulse-glow">
            {config?.logo_url ? (
              <img src={config.logo_url} alt={storeName} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center gradient-primary">
                <Store className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gradient">{storeName}</h1>
          <p className="mt-2 text-muted-foreground">Point of Sale Modern</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {isLogin ? 'Masuk ke Akun' : 'Buat Akun Baru'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? 'Masukkan kredensial untuk melanjutkan'
                : 'Isi form untuk membuat akun baru'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-secondary border-border rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-11 bg-secondary border-border rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 gradient-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                'Masuk'
              ) : (
                'Daftar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Aplikasi POS Kasir Modern © 2026 • v1.1.2
        </p>
      </div>
    </div>
  );
}

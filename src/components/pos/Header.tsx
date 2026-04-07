import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { LogOut, User, Store, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();
  const { data: config } = useStoreConfig();
  const navigate = useNavigate();

  const storeName = config?.store_name || 'WUDkopi';

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 lg:px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border overflow-hidden pos-shadow">
          {config?.logo_url ? (
            <img src={config.logo_url} alt={storeName} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center gradient-primary">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">{storeName}</h1>
          <p className="text-xs text-muted-foreground">Point of Sale Modern</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 border-border hover:bg-muted rounded-xl transition-all h-10"
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Dashboard</span>
        </Button>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 min-h-10">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground truncate max-w-[150px]">
            {user?.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="rounded-xl hover:bg-destructive/10 hover:text-destructive h-10 w-10"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

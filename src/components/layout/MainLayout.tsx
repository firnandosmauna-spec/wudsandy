import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2, Menu, User } from 'lucide-react';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { useStoreConfig } from '@/hooks/useStoreConfig';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: config } = useStoreConfig();
  const storeName = config?.store_name || 'WUDkopi';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 md:px-8 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-accent transition-colors">
                  <Menu className="h-6 w-6 text-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
                <Sidebar onClose={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <h2 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight truncate max-w-[120px] md:max-w-none">
              {storeName}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs md:text-sm font-black text-foreground truncate max-w-[120px] md:max-w-none">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Petugas</p>
            </div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border overflow-hidden pos-shadow">
              <img src={config?.logo_url || "/wudkopi-logo.png"} alt={storeName} className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 bg-background/50">
          <div className="mx-auto max-w-[1600px] animate-fade-in-down">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

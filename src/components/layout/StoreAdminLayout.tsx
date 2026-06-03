import { ReactNode, useState } from 'react';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Globe, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useStoreConfig } from '@/hooks/useStoreConfig';

interface StoreAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: "📈", label: 'Overview', path: '/landing-admin' },
  { icon: "🎨", label: 'Editor Tampilan', path: '/landing-admin/editor' },
  { icon: "🍰", label: 'Data Produk', path: '/landing-admin/products' },
  { icon: "📊", label: 'Laporan Penjualan', path: '/landing-admin/sales' },
  { icon: "⚙️", label: 'Konfigurasi Toko', path: '/landing-admin/config' },
];

export default function StoreAdminLayout({ children }: StoreAdminLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const { data: config } = useStoreConfig();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const storeName = config?.store_name || 'WUDkopi';

  return (
    <div className="flex h-screen w-full bg-[#f0f9f1] overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-[#ec4899]/10 transition-all duration-300 ease-in-out z-40 shadow-sm",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-[#ec4899]/5">
          <div className="h-10 w-10 rounded-xl bg-[#ec4899] flex items-center justify-center text-white shadow-lg shadow-pink-100 shrink-0">
            <Globe className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="ml-4 overflow-hidden">
              <h1 className="font-black text-[#5d4037] uppercase tracking-tighter leading-none text-lg">WEB ADMIN</h1>
              <p className="text-[10px] font-bold text-[#ec4899] uppercase tracking-widest mt-1">Bakery Manager</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 uppercase tracking-tighter group",
                isActive 
                  ? "bg-[#ec4899] text-white shadow-lg shadow-pink-200 scale-[1.02]" 
                  : "text-[#5d4037]/60 hover:bg-pink-50 hover:text-[#ec4899]"
              )}
            >
              <span className={cn(
                "text-2xl shrink-0 transition-transform duration-300 drop-shadow-md",
                !collapsed && "group-hover:scale-125 group-hover:rotate-12"
              )}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-pink-50">
          <button 
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black text-rose-500 hover:bg-rose-50 w-full transition-all uppercase tracking-tighter",
              collapsed && "justify-center"
            )}
          >
            <span className="text-xl drop-shadow-md">🚪</span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#ec4899]/10 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-pink-50 text-[#ec4899]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-[#ec4899]/40 hover:text-[#ec4899] transition-colors"
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div className="h-6 w-[1px] bg-pink-100 hidden md:block mx-2" />
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#f0f9f1] rounded-full text-[10px] font-black uppercase tracking-widest text-[#ec4899]">
              <Eye className="h-3 w-3" />
              Bakery Preview
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.open('/', '_blank')}
              className="rounded-xl bg-[#ec4899] hover:bg-[#db2777] text-white font-bold px-6 h-11 shadow-lg shadow-pink-100 gap-2"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Buka Toko</span>
            </Button>
            <div className="h-10 w-10 rounded-full border-2 border-[#ec4899]/20 overflow-hidden bg-white p-0.5">
               <img src={config?.logo_url || "/bakery-logo.png"} className="h-full w-full object-cover rounded-full" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-72 h-full bg-white flex flex-col p-6 animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="h-10 w-10 rounded-xl bg-[#ec4899] flex items-center justify-center text-white shadow-lg shadow-pink-100">
                <Globe className="h-6 w-6" />
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-pink-50">
                <X className="h-5 w-5 text-[#ec4899]" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all uppercase tracking-tighter",
                    isActive ? "bg-[#ec4899] text-white shadow-md shadow-pink-100" : "text-[#5d4037]/60 hover:bg-pink-50 hover:text-[#ec4899]"
                  )}
                >
                  <span className="text-2xl drop-shadow-md">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

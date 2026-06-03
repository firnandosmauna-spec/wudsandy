import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Package, 
  Tags, 
  Users, 
  Store, 
  UserCog, 
  Database, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Receipt,
  Layers,
  Wallet,
  Coffee,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/hooks/useStoreConfig';

const menuItems = [
  { icon: "📊", label: 'Dashboard', path: '/dashboard' },
  { icon: "💰", label: 'Kasir (POS)', path: '/pos' },
  { icon: "🕒", label: 'Shift Kasir', path: '/shift' },
  { icon: "🧾", label: 'Riwayat Transaksi', path: '/transactions' },
  { 
    label: 'Laporan', 
    isHeader: true 
  },
  { icon: "📈", label: 'Laba Rugi', path: '/reports/profit-loss' },
  { icon: "🛍️", label: 'Penjualan', path: '/reports/sales' },
  { icon: "☕", label: 'Laporan Bahan', path: '/reports/coffee-powder' },
  { icon: "🛒", label: 'Pembelian', path: '/reports/purchases' },
  { 
    label: 'Manajemen', 
    isHeader: true 
  },
  { icon: "🍰", label: 'Kelola Produk', path: '/inventory/products' },
  { icon: "🏷️", label: 'Kelola Kategori', path: '/inventory/categories' },
  { icon: "👥", label: 'Pelanggan', path: '/customers' },
  { icon: "🏠", label: 'Kelola Toko', path: '/store' },
  { icon: "🔑", label: 'Kelola Pengguna', path: '/users' },
  { icon: "💸", label: 'Pengaturan Gaji', path: '/users/payroll' },
  { 
    label: 'Sistem', 
    isHeader: true 
  },
  { icon: "💾", label: 'Backup & Restore', path: '/backup' },
  { icon: "⚙️", label: 'Pengaturan', path: '/settings' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { data: config } = useStoreConfig();
  const storeName = config?.store_name || 'WUDkopi';

  return (
    <aside 
      className={cn(
        "relative flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl border border-border bg-muted flex items-center justify-center font-black text-primary shadow-sm overflow-hidden">
              <img src={config?.logo_url || "/wudkopi-logo.png"} className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold text-gradient truncate max-w-[140px]">{storeName}</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border overflow-hidden pos-shadow">
            <img src={config?.logo_url || "/wudkopi-logo.png"} alt={storeName} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item, index) => {
          if (item.isHeader) {
            return !collapsed ? (
              <div key={index} className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                {item.label}
              </div>
            ) : (
              <div key={index} className="my-2 border-t border-border/50 mx-2" />
            );
          }

          const icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path !== '/pos' && item.path !== '/landing-admin'} 
              onClick={onClose}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition-all duration-300 uppercase tracking-tighter",
                isActive 
                  ? "bg-[#ec4899] text-white shadow-lg shadow-pink-200 scale-[1.02]" 
                  : "text-[#5d4037]/60 hover:bg-[#f0f9f1] hover:text-[#ec4899]"
              )}
            >
              <span className={cn(
                "text-2xl shrink-0 transition-transform duration-300 drop-shadow-md",
                !collapsed && "group-hover:scale-125 group-hover:rotate-12"
              )}>
                {icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-pink-100 p-2">
        <button
          onClick={() => {
            signOut();
            if (onClose) onClose();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-tighter",
            collapsed && "justify-center"
          )}
        >
          <span className="text-xl drop-shadow-md">🚪</span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

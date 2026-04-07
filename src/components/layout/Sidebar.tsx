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
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStoreConfig } from '@/hooks/useStoreConfig';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Kasir (POS)', path: '/pos' },
  { icon: Layers, label: 'Shift Kasir', path: '/shift' },
  { icon: Receipt, label: 'Riwayat Transaksi', path: '/transactions' },
  { 
    label: 'Laporan', 
    isHeader: true 
  },
  { icon: BarChart3, label: 'Laba Rugi', path: '/reports/profit-loss' },
  { icon: BarChart3, label: 'Penjualan', path: '/reports/sales' },
  { icon: Coffee, label: 'Laporan Bubuk Kopi', path: '/reports/coffee-powder' },
  { icon: BarChart3, label: 'Pembelian', path: '/reports/purchases' },
  { 
    label: 'Manajemen', 
    isHeader: true 
  },
  { icon: Package, label: 'Kelola Produk', path: '/inventory/products' },
  { icon: Tags, label: 'Kelola Kategori', path: '/inventory/categories' },
  { icon: Users, label: 'Pelanggan', path: '/customers' },
  { icon: Store, label: 'Kelola Toko', path: '/store' },
  { icon: UserCog, label: 'Kelola Pengguna', path: '/users' },
  { icon: Wallet, label: 'Pengaturan Gaji', path: '/users/payroll' },
  { 
    label: 'Sistem', 
    isHeader: true 
  },
  { icon: Database, label: 'Backup & Restore', path: '/backup' },
  { icon: Settings, label: 'Pengaturan', path: '/settings' },
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

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path !== '/pos'} // Most items should match exactly, POS might have subroutes
              onClick={onClose}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "gradient-primary text-primary-foreground shadow-lg pos-shadow" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", !collapsed && "group-hover:scale-110 transition-transform")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => {
            signOut();
            if (onClose) onClose();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

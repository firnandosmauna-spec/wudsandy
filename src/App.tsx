import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MainLayout from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";

// New Modules
import ShiftManagement from "./pages/Shift/ShiftHistory";
import TransactionHistory from "./pages/Transactions/TransactionHistory";
import ProfitLossReport from "./pages/Reports/ProfitLoss";
import SalesReport from "./pages/Reports/SalesReport";
import CoffeePowderReport from "./pages/Reports/CoffeePowderReport";
import PurchaseReport from "./pages/Reports/PurchaseReport";
import ProductManagement from "./pages/Inventory/Products";
import CategoryManagement from "./pages/Inventory/Categories";
import CustomerManagement from "./pages/Customers";
import UserManagement from "./pages/Users/UserManagement";
import PayrollSettings from "./pages/Users/PayrollSettings";
import StoreManagement from "./pages/Store";
import BackupRestore from "./pages/Backup/BackupRestore";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Root Redirects based on Auth in Index */}
              <Route path="/" element={<Index />} />

              {/* Administrative Routes wrapped in MainLayout */}
              <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/shift" element={<MainLayout><ShiftManagement /></MainLayout>} />
              <Route path="/transactions" element={<MainLayout><TransactionHistory /></MainLayout>} />
              
              {/* Reports */}
              <Route path="/reports/profit-loss" element={<MainLayout><ProfitLossReport /></MainLayout>} />
              <Route path="/reports/sales" element={<MainLayout><SalesReport /></MainLayout>} />
              <Route path="/reports/coffee-powder" element={<MainLayout><CoffeePowderReport /></MainLayout>} />
              <Route path="/reports/purchases" element={<MainLayout><PurchaseReport /></MainLayout>} />
              
              {/* Inventory */}
              <Route path="/inventory/products" element={<MainLayout><ProductManagement /></MainLayout>} />
              <Route path="/inventory/categories" element={<MainLayout><CategoryManagement /></MainLayout>} />
              
              {/* Management */}
              <Route path="/customers" element={<MainLayout><CustomerManagement /></MainLayout>} />
              <Route path="/store" element={<MainLayout><StoreManagement /></MainLayout>} />
              <Route path="/users" element={<MainLayout><UserManagement /></MainLayout>} />
              <Route path="/users/payroll" element={<MainLayout><PayrollSettings /></MainLayout>} />
              
              {/* System */}
              <Route path="/backup" element={<MainLayout><BackupRestore /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
              
              {/* Standalone POS with Cart State */}
              <Route path="/pos" element={<CartProvider><POS /></CartProvider>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

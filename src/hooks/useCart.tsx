import { useState, createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Product, CartItem } from '@/types/pos';

interface CartStateContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartActionsContextType {
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartStateContext = createContext<CartStateContextType | undefined>(undefined);
const CartActionsContext = createContext<CartActionsContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  ), [items]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const stateValue = useMemo(() => ({ items, total, itemCount }), [items, total, itemCount]);
  const actionsValue = useMemo(() => ({ addItem, removeItem, updateQuantity, clearCart }), [addItem, removeItem, updateQuantity, clearCart]);

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCart() {
  const state = useContext(CartStateContext);
  const actions = useContext(CartActionsContext);
  if (state === undefined || actions === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return { ...state, ...actions };
}

export function useCartState() {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState must be used within a CartProvider');
  }
  return context;
}

export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (context === undefined) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return context;
}

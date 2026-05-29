import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('style_beauty_cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = useCallback((product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, [setItems]);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, [setItems]);

  const updateQuantity = useCallback((id, delta) => {
    setItems((current) => (
      current.map((item) => {
        if (item.id !== id) return item;
        const nextQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(1, nextQuantity) };
      })
    ));
  }, [setItems]);

  const clearCart = useCallback(() => setItems([]), [setItems]);
  const total = items.reduce((sum, item) => sum + Number(item.price || item.precio || 0) * item.quantity, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, total, isCartOpen, setIsCartOpen }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, isCartOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

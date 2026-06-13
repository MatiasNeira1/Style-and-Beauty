import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const CartContext = createContext(null);

function isReservation(item) {
  return item?.type === 'reservation';
}

function isExpired(item, now = Date.now()) {
  return isReservation(item) && item.expiresAt && new Date(item.expiresAt).getTime() <= now;
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('style_beauty_cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastCartError, setLastCartError] = useState('');

  useEffect(() => {
    const removeExpired = () => {
      const now = Date.now();
      setItems((current) => current.filter((item) => !isExpired(item, now)));
    };

    removeExpired();
    const intervalId = window.setInterval(removeExpired, 1000);
    return () => window.clearInterval(intervalId);
  }, [setItems]);

  const addItem = useCallback((product) => {
    setLastCartError('');
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

  const addReservationItem = useCallback((reservation) => {
    setLastCartError('');

    let result = { ok: true };
    setItems((current) => {
      const now = Date.now();
      const activeItems = current.filter((item) => !isExpired(item, now));
      const duplicate = activeItems.some((item) => (
        isReservation(item) && item.serviceId === reservation.serviceId
      ));

      if (duplicate) {
        result = {
          ok: false,
          error: 'Ya tienes una reserva temporal para este servicio en el carrito.',
        };
        return activeItems;
      }

      return [...activeItems, { ...reservation, type: 'reservation', quantity: 1 }];
    });

    if (!result.ok) {
      setLastCartError(result.error);
      setIsCartOpen(true);
      return result;
    }

    setIsCartOpen(true);
    return result;
  }, [setItems]);

  const hasReservationForService = useCallback((serviceId) => {
    const now = Date.now();
    return items.some((item) => (
      isReservation(item) && !isExpired(item, now) && item.serviceId === serviceId
    ));
  }, [items]);

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
  const total = items.reduce((sum, item) => sum + Number(item.price || item.precio || 0) * (item.quantity || 1), 0);

  const value = useMemo(
    () => ({
      items,
      addItem,
      addReservationItem,
      hasReservationForService,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      isCartOpen,
      setIsCartOpen,
      lastCartError,
      setLastCartError,
    }),
    [items, addItem, addReservationItem, hasReservationForService, removeItem, updateQuantity, clearCart, total, isCartOpen, lastCartError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

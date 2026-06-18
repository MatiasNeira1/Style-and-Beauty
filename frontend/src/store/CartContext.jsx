import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'style_beauty_cart';
const CART_SCHEMA_VERSION = 2;
const LEGACY_CART_KEYS = ['cart', 'carrito', 'styleBeautyCart', 'style_beauty_checkout'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isReservation(item) {
  return item?.type === 'reservation';
}

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function isDateTimeLike(value) {
  return typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value));
}

function hasReservationDateTime(item) {
  return isDateTimeLike(item?.startsAt) || isDateTimeLike(item?.time);
}

function isExpired(item, now = Date.now()) {
  return isReservation(item) && item.expiresAt && new Date(item.expiresAt).getTime() <= now;
}

function hasReservationContract(item) {
  return item?.cartVersion === CART_SCHEMA_VERSION
    && isValidUuid(item?.reservationId)
    && isValidUuid(item?.serviceId)
    && isValidUuid(item?.staffId)
    && Boolean(item?.date)
    && hasReservationDateTime(item);
}

function sanitizeCartItems(items, now = Date.now()) {
  if (!Array.isArray(items)) return { items: [], removedLegacy: false };

  let removedLegacy = false;
  const nextItems = items.filter((item) => {
    if (isExpired(item, now)) return false;
    if (isReservation(item) && !hasReservationContract(item)) {
      removedLegacy = true;
      return false;
    }
    return true;
  });

  return { items: nextItems, removedLegacy };
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage(CART_STORAGE_KEY, []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastCartError, setLastCartError] = useState('');

  useEffect(() => {
    LEGACY_CART_KEYS.forEach((key) => window.localStorage.removeItem(key));
    try {
      const pending = JSON.parse(window.sessionStorage.getItem('reservaPendiente') || 'null');
      if (pending && (!pending.idServicio || !pending.profesionalSeleccionado || !pending.fechaSeleccionada || !pending.horarioSeleccionado)) {
        window.sessionStorage.removeItem('reservaPendiente');
      }
    } catch {
      window.sessionStorage.removeItem('reservaPendiente');
    }
  }, []);

  useEffect(() => {
    const removeExpired = () => {
      const now = Date.now();
      setItems((current) => {
        const sanitized = sanitizeCartItems(current, now);
        if (sanitized.removedLegacy) {
          window.setTimeout(() => {
            setLastCartError('Quitamos reservas antiguas del carrito. Selecciona nuevamente fecha y hora para pagar.');
          }, 0);
        }
        return sanitized.items;
      });
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

      const refreshedItems = reservation.expiresAt
        ? activeItems.map((item) => (
          isReservation(item) ? { ...item, expiresAt: reservation.expiresAt } : item
        ))
        : activeItems;

      return [...refreshedItems, { ...reservation, cartVersion: CART_SCHEMA_VERSION, type: 'reservation', quantity: 1 }];
    });

    if (!result.ok) {
      setLastCartError(result.error);
      return result;
    }

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

  const removeReservationItems = useCallback(() => {
    setItems((current) => current.filter((item) => !isReservation(item)));
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
      removeReservationItems,
      updateQuantity,
      clearCart,
      total,
      isCartOpen,
      setIsCartOpen,
      lastCartError,
      setLastCartError,
      cartSchemaVersion: CART_SCHEMA_VERSION,
    }),
    [items, addItem, addReservationItem, hasReservationForService, removeItem, removeReservationItems, updateQuantity, clearCart, total, isCartOpen, lastCartError],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

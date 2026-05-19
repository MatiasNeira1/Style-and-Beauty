import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const addItem = (product) => setItems((current) => [...current, { ...product, quantity: 1 }]);
  const value = useMemo(() => ({ items, addItem, setItems }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

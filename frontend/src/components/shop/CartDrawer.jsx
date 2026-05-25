import { useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { Button } from '../ui/Button.jsx';
import { useCart } from '../../store/CartContext.jsx';

export function CartDrawer() {
  const ref = useRef(null);
  const { items, total, isCartOpen, setIsCartOpen, removeItem, updateQuantity } = useCart();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        x: isCartOpen ? 0 : '120%',
        duration: 0.45,
        ease: 'power3.out',
      });
    }, ref);

    return () => ctx.revert();
  }, [isCartOpen]);

  return (
    <aside ref={ref} className="cart-drawer" aria-hidden={!isCartOpen}>
      <header>
        <h2>Carrito</h2>
        <Button variant="ghost" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito"><X size={18} /></Button>
      </header>
      <div className="cart-items">
        {items.length === 0 && <p className="text-center py-8 text-sm text-neutral-400">Tu carrito está vacío.</p>}
        {items.map((item) => (
          <div key={item.id} className="cart-line-enhanced">
            <div className="cart-line-info">
              <span className="cart-item-name">{item.name || item.nombre}</span>
              <span className="cart-item-price">${Number(item.price || item.precio || 0)}</span>
            </div>
            <div className="cart-line-actions">
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.id, -1)} aria-label="Restar">-</button>
                <span>{item.quantity || 1}</span>
                <button onClick={() => updateQuantity(item.id, 1)} aria-label="Sumar">+</button>
              </div>
              <button className="cart-remove-btn" onClick={() => removeItem(item.id)} aria-label="Quitar">
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
      <footer>
        <strong>Total ${total}</strong>
        <Button onClick={() => setIsCartOpen(false)}>Continuar</Button>
      </footer>
    </aside>
  );
}

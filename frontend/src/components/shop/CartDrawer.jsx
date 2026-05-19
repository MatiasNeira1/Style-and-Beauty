import { useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { Button } from '../ui/Button.jsx';
import { useCart } from '../../store/CartContext.jsx';

export function CartDrawer() {
  const ref = useRef(null);
  const { items, total, isCartOpen, setIsCartOpen, removeItem } = useCart();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        x: isCartOpen ? 0 : '105%',
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
        {items.length === 0 && <p>Tu carrito esta vacio.</p>}
        {items.map((item) => (
          <div key={item.id} className="cart-line">
            <div>
              <strong>{item.name || item.nombre}</strong>
              <span>x {item.quantity || 1}</span>
            </div>
            <button onClick={() => removeItem(item.id)}>Quitar</button>
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

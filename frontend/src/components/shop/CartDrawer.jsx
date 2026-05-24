import { X } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useCart } from '../../store/CartContext.jsx';

export function CartDrawer() {
  const { items, total, isCartOpen, setIsCartOpen, removeItem } = useCart();

  return (
    <aside className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`} aria-hidden={!isCartOpen}>
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

import { X } from 'lucide-react';
import { useCart } from '../../store/CartContext.jsx';
import { Button } from '../ui/Button.jsx';

export function CartDrawer() {
  const { items, total, isCartOpen, setIsCartOpen, removeItem, updateQuantity } = useCart();

  return (
    <aside className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`} aria-hidden={!isCartOpen}>
      <header>
        <h2>Carrito</h2>
        <Button variant="ghost" onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito">
          <X size={18} />
        </Button>
      </header>

      <div className="cart-items" data-lenis-prevent>
        {items.length === 0 && <p className="text-center py-8 text-sm text-neutral-400">Tu carrito está vacío.</p>}
        {items.map((item) => (
          <div key={item.id} className="cart-line-enhanced">
            <div className="cart-line-item-wrapper">
              {(item.imagenUrl || item.imagen || item.image) && (
                <img
                  src={item.imagenUrl || item.imagen || item.image}
                  alt={item.name || item.nombre}
                  className="cart-item-image"
                />
              )}
              <div className="cart-line-details">
                <div className="cart-line-info">
                  <span className="cart-item-name">{item.name || item.nombre}</span>
                  <span className="cart-item-price">${Number(item.price || item.precio || 0).toLocaleString('es-CL')}</span>
                </div>
                <div className="cart-line-actions">
                  <div className="quantity-controls">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label="Restar">-</button>
                    <span>{item.quantity || 1}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Sumar">+</button>
                  </div>
                  <button type="button" className="cart-remove-btn" onClick={() => removeItem(item.id)} aria-label="Quitar">
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer>
        <strong>Total ${total.toLocaleString('es-CL')}</strong>
        <Button onClick={() => setIsCartOpen(false)}>Continuar</Button>
      </footer>
    </aside>
  );
}

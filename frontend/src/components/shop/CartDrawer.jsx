import { Button } from '../ui/Button.jsx';

export function CartDrawer({ items = [], open, onClose }) {
  if (!open) return null;

  return (
    <aside className="cart-drawer">
      <header>
        <h2>Carrito</h2>
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
      </header>
      {items.map((item) => (
        <p key={item.id}>{item.name} x {item.quantity || 1}</p>
      ))}
    </aside>
  );
}

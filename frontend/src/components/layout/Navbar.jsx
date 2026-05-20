import { NavLink } from 'react-router-dom';
import { CalendarDays, Menu, ShoppingBag, UserRound } from 'lucide-react';
import { useCart } from '../../store/CartContext.jsx';

const links = [
  ['/', 'Inicio'],
  ['/servicios', 'Servicios'],
  ['/productos', 'Productos'],
  ['/reservar', 'Reservar'],
  ['/contacto', 'Contacto'],
];

export function Navbar() {
  const { items, setIsCartOpen } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="navbar">
      <NavLink to="/" className="brand">Style & Beauty</NavLink>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
      </nav>
      <div className="navbar-actions">
        <NavLink to="/perfil" className="icon-link" aria-label="Perfil">
          <UserRound size={20} />
        </NavLink>
        <NavLink to="/reservar" className="icon-link" aria-label="Reservar">
          <CalendarDays size={20} />
        </NavLink>
        <button className="icon-link cart-button" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrito">
          <ShoppingBag size={20} />
          {count > 0 && <span>{count}</span>}
        </button>
        <button className="icon-link mobile-only" aria-label="Menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

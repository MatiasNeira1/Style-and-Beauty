import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Menu, X, ShoppingBag, UserRound } from 'lucide-react';
import { useCart } from '../../store/CartContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const links = [
  ['/', 'Inicio'],
  ['/servicios', 'Servicios'],
  ['/productos', 'Productos'],
  ['/reservar', 'Reservar'],
  ['/contacto', 'Contacto'],
];

export function Navbar() {
  const { items, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className={`navbar ${isOpen ? 'navbar-open' : ''}`}>
      <NavLink to="/" className="brand" onClick={() => setIsOpen(false)}>Style & Beauty</NavLink>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
      </nav>
      <div className="navbar-actions">
        <NavLink to={isAuthenticated ? '/perfil' : '/login'} className="icon-link" aria-label={isAuthenticated ? 'Perfil' : 'Iniciar sesion'} onClick={() => setIsOpen(false)}>
          <UserRound size={20} />
        </NavLink>
        <NavLink to="/reservar" className="icon-link" aria-label="Reservar" onClick={() => setIsOpen(false)}>
          <CalendarDays size={20} />
        </NavLink>
        <button className="icon-link cart-button" onClick={() => { setIsCartOpen(true); setIsOpen(false); }} aria-label="Abrir carrito">
          <ShoppingBag size={20} />
          {count > 0 && <span>{count}</span>}
        </button>
        <button className="icon-link mobile-only" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {isOpen && (
        <nav className="mobile-nav animate-fade-in">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setIsOpen(false)}>{label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

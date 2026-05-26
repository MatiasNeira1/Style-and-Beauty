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
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  let profilePath = '/login';
  if (isAuthenticated) {
    if (user?.rol === 'ADMIN') {
      profilePath = '/admin';
    } else if (user?.rol === 'STAFF') {
      profilePath = '/staff';
    } else {
      profilePath = '/perfil';
    }
  }

  return (
    <header className={`navbar ${isOpen ? 'navbar-open' : ''}`}>
      <NavLink to="/" className="brand" onClick={() => setIsOpen(false)}>Style & Beauty</NavLink>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
        {isAuthenticated && user?.rol === 'STAFF' && (
          <NavLink to="/staff" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Mi Panel Staff</NavLink>
        )}
        {isAuthenticated && user?.rol === 'ADMIN' && (
          <NavLink to="/admin" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Panel Admin</NavLink>
        )}
      </nav>
      <div className="navbar-actions">
        <NavLink to={profilePath} className="icon-link" aria-label={isAuthenticated ? 'Perfil' : 'Iniciar sesion'} onClick={() => setIsOpen(false)}>
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
          {isAuthenticated && user?.rol === 'STAFF' && (
            <NavLink to="/staff" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Mi Panel Staff</NavLink>
          )}
          {isAuthenticated && user?.rol === 'ADMIN' && (
            <NavLink to="/admin" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Panel Admin</NavLink>
          )}
        </nav>
      )}
    </header>
  );
}

import { NavLink } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const links = [
  ['/', 'Inicio'],
  ['/servicios', 'Servicios'],
  ['/productos', 'Productos'],
  ['/reservar', 'Reservar'],
  ['/contacto', 'Contacto'],
];

export function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">Style & Beauty</NavLink>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>{label}</NavLink>
        ))}
      </nav>
      <NavLink to="/checkout" className="icon-link" aria-label="Carrito">
        <ShoppingBag size={20} />
      </NavLink>
    </header>
  );
}

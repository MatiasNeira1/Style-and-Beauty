import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../../store/CartContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const links = [
  ['/', 'Inicio'],
  ['/servicios', 'Servicios'],
  ['/profesionales', 'Profesionales'],
  ['/productos', 'Productos'],
  ['/reservar', 'Reservar'],
  ['/contacto', 'Contacto'],
];

export function Navbar() {
  const { items, setIsCartOpen } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileClick = (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'admin' || user?.role === 'ADMIN') {
      navigate('/admin');
    } else if (user?.role === 'employee' || user?.role === 'STAFF') {
      navigate('/employee');
    } else {
      navigate('/perfil');
    }
  };

  return (
    <>
      <motion.header
        className="navbar"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <NavLink to="/" className="brand" onClick={() => setMobileOpen(false)}>
          Style &amp; Beauty
        </NavLink>

        <nav aria-label="Navegación principal">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          {!isAuthenticated ? (
            <NavLink to="/login" className="icon-link login-link" aria-label="Iniciar sesión">
              <LogIn size={16} />
              <span>Login</span>
            </NavLink>
          ) : (
            <button onClick={handleProfileClick} className="icon-link profile-link" aria-label="Perfil">
              <UserRound size={20} />
            </button>
          )}
          <NavLink to="/reservar" className="icon-link" aria-label="Reservar">
            <CalendarDays size={20} />
          </NavLink>
          <button className="icon-link cart-button" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrito">
            <ShoppingBag size={20} />
            {count > 0 && <span>{count}</span>}
          </button>
          <button
            className="icon-link mobile-only"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)}>
                {label}
              </NavLink>
            ))}
            {!isAuthenticated ? (
              <NavLink to="/login" onClick={() => setMobileOpen(false)} className="mobile-menu-login">
                Iniciar sesión
              </NavLink>
            ) : (
              <button onClick={handleProfileClick}>Mi Perfil</button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

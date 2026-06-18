import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useAuth } from '../../store/AuthContext.jsx';
import { useCart } from '../../store/CartContext.jsx';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const userRole = String(user?.rol || user?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF' || userRole === 'EMPLOYEE';

  const handleProfileClick = (event) => {
    event.preventDefault();
    setMobileOpen(false);
    if (!isAuthenticated) {
      navigate('/login');
    } else if (isAdmin) {
      navigate('/admin');
    } else if (isStaff) {
      navigate('/staff');
    } else {
      navigate('/perfil');
    }
  };

  const handleNavClick = (event, to) => {
    setMobileOpen(false);

    if (to === '/productos') {
      event.preventDefault();
      navigate('/productos', { state: { showProductsHome: Date.now() } });
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
            <NavLink key={to} to={to} end={to === '/'} onClick={(event) => handleNavClick(event, to)}>
              {label}
            </NavLink>
          ))}
          {isAuthenticated && (isStaff || isAdmin) && (
            <NavLink to="/staff" onClick={(event) => handleNavClick(event, '/staff')}>
              Mi Panel Staff
            </NavLink>
          )}
        </nav>

        <div className="navbar-actions">
          {!isAuthenticated ? (
            <NavLink to="/login" className="icon-link login-link" aria-label="Iniciar sesión">
              <LogIn size={16} />
              <span>Login</span>
            </NavLink>
          ) : (
            <button type="button" onClick={handleProfileClick} className="icon-link profile-link" aria-label="Perfil">
              <UserRound size={20} />
            </button>
          )}
          <NavLink to="/reservar" className="icon-link" aria-label="Reservar">
            <CalendarDays size={20} />
          </NavLink>
          <button type="button" className="icon-link cart-button" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrito">
            <ShoppingBag size={20} />
            {count > 0 && <span>{count}</span>}
          </button>
          <button
            type="button"
            className="icon-link mobile-only"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
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
              <NavLink key={to} to={to} end={to === '/'} onClick={(event) => handleNavClick(event, to)}>
                {label}
              </NavLink>
            ))}
            {isAuthenticated && (isStaff || isAdmin) && (
              <NavLink to="/staff" onClick={() => setMobileOpen(false)}>
                Mi Panel Staff
              </NavLink>
            )}
            {!isAuthenticated ? (
              <NavLink to="/login" onClick={() => setMobileOpen(false)} className="mobile-menu-login">
                Iniciar sesión
              </NavLink>
            ) : (
              <button type="button" onClick={handleProfileClick}>Mi Perfil</button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

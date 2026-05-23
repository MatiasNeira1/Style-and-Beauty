import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarDays, Menu, ShoppingBag, UserRound, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileClick = (e) => {
    e.preventDefault();
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
        <NavLink to="/" className="brand">Style &amp; Beauty</NavLink>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
        <div className="navbar-actions">
          {!isAuthenticated ? (
            <NavLink to="/login" className="icon-link" aria-label="Iniciar Sesión" style={{ display: 'flex', gap: '0.4rem', width: 'auto', padding: '0 1rem', borderRadius: '999px', background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
              <LogIn size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Login</span>
            </NavLink>
          ) : (
            <button onClick={handleProfileClick} className="icon-link" aria-label="Perfil" style={{ background: 'rgba(212, 122, 158, 0.1)', color: 'var(--color-primary-strong)', borderColor: 'rgba(212, 122, 158, 0.2)' }}>
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
            aria-label="Menu"
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
              <NavLink to="/login" onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-primary-strong)' }}>
                Iniciar Sesión
              </NavLink>
            ) : (
              <button onClick={(e) => { handleProfileClick(e); setMobileOpen(false); }} style={{ textAlign: 'left', width: '100%' }}>
                Mi Perfil
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

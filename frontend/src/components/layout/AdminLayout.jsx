import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarRange,
  CreditCard,
  LogOut,
  Menu,
  Package,
  Plus,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';

const adminGroups = [
  {
    label: 'Operacion',
    links: [
      { to: '/admin', label: 'Dashboard', icon: BarChart3 },
      { to: '/admin/agenda', label: 'Agenda', icon: CalendarRange },
      { to: '/admin/servicios', label: 'Servicios', icon: Scissors },
    ],
  },
  {
    label: 'Gestion',
    links: [
      { to: '/admin/inventario', label: 'Inventario', icon: Package },
      { to: '/admin/clientes', label: 'Usuarios', icon: Users },
      { to: '/admin/staff', label: 'Profesionales', icon: ShieldCheck },
    ],
  },
  {
    label: 'Finanzas',
    links: [{ to: '/admin/pagos', label: 'Pagos', icon: CreditCard }],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [isOpen, setIsOpen] = useState(false);
  const today = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()),
    [],
  );
  const adminName = user?.nombre || user?.displayName || user?.email || 'Administracion';
  const initials = adminName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const closeOverlay = () => {
    setIsOpen(false);
  };

  return (
    <section className="admin-layout">
      <aside
        id="admin-sidebar-drawer"
        className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu administrativo"
      >
        <div className="admin-brand">
          <button type="button" className="admin-brand-mark" onClick={() => setIsOpen(true)} aria-label="Style & Beauty Admin Center">
            <Sparkles size={18} />
          </button>
          <div>
            <strong>Style & Beauty</strong>
            <small>Admin center</small>
          </div>
          <div className="admin-sidebar-controls">
            <button type="button" onClick={closeOverlay} aria-label="Cerrar menu administrativo" title="Cerrar menu">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Navegacion administrativa">
          {adminGroups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/admin'} onClick={closeOverlay}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar" aria-hidden="true">{initials || 'AD'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{adminName}</strong>
            <small>{user?.rol || 'ADMIN'}</small>
          </div>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="admin-shell">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-header-menu"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir menu administrativo"
            aria-expanded={isOpen}
            aria-controls="admin-sidebar-drawer"
          >
            <Menu size={19} />
          </button>
          <div>
            <span className="admin-date">{today}</span>
            <h1>Panel administrativo</h1>
          </div>
          <label className="admin-search">
            <Search size={17} />
            <input type="search" placeholder="Buscar reservas, clientes o servicios" aria-label="Buscar dentro del admin" />
          </label>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-icon-button" aria-label="Ver notificaciones">
              <Bell size={18} />
              <span />
            </button>
            <NavLink to="/admin/agenda" className="admin-quick-create">
              <Plus size={17} />
              Nueva reserva
            </NavLink>
            <button
              type="button"
              className="admin-icon-button admin-logout-topbar"
              onClick={handleLogout}
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {isOpen && <button type="button" className="admin-scrim" aria-label="Cerrar menu" onClick={() => setIsOpen(false)} />}
    </section>
  );
}

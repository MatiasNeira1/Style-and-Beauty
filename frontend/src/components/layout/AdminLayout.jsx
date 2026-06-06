import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
import { profileService } from '../../services/profileService.js';

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
  {
    label: 'Cuenta',
    links: [{ to: '/admin/perfil', label: 'Perfil', icon: UserRound }],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user),
    retry: false,
    staleTime: 1000 * 60,
  });
  const today = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()),
    [],
  );
  const profileName = [profileQuery.data?.nombre, profileQuery.data?.apellidos].filter(Boolean).join(' ');
  const adminName = profileName || user?.nombre || user?.displayName || user?.email || 'Administracion';
  const adminRole = profileQuery.data?.rol || profileQuery.data?.tipoPerfil || user?.rol || 'ADMIN';
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

  const handleLogout = async () => {
    closeOverlay();
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
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
          <NavLink to="/admin/perfil" className="admin-user-card" onClick={closeOverlay}>
            <div className="admin-avatar" aria-hidden="true">{initials || 'AD'}</div>
            <div className="admin-user-copy">
              <strong>{adminName}</strong>
              <small>{adminRole}</small>
            </div>
            <UserRound size={17} aria-hidden="true" />
          </NavLink>
          <button type="button" className="admin-logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesion
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

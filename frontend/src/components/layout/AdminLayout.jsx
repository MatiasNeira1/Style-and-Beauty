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
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../store/AuthContext.jsx';
import { profileService } from '../../services/profileService.js';
import { useAdminDashboardMetrics } from '../../hooks/admin/useAdminDashboardMetrics.js';
import { formatTime } from '../../utils/adminFormatters.js';
import { calculateInventoryMetrics } from '../../utils/inventoryStockRules.js';

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getMyProfile,
    enabled: Boolean(user),
    retry: false,
    staleTime: 1000 * 60,
  });
  const dashboardQuery = useAdminDashboardMetrics();
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
  const notificationItems = useMemo(() => {
    const metrics = dashboardQuery.metrics || {};
    const raw = metrics.raw || {};
    const bookings = Array.isArray(raw.bookings) ? raw.bookings : [];
    const products = Array.isArray(raw.products) ? raw.products : [];
    const stock = Array.isArray(raw.stock) ? raw.stock : [];
    const nextBookings = Array.isArray(metrics.nextBookings) ? metrics.nextBookings : [];
    const pendingBookings = bookings.filter((booking) => String(booking.estadoCita || '').toUpperCase().includes('PENDIENTE'));
    const inventoryMetrics = calculateInventoryMetrics(products, stock);
    const outStockCount = inventoryMetrics.outStock.length;
    const lowStockCount = inventoryMetrics.lowStock.length;
    const partialErrors = Array.isArray(raw.partialErrors) ? raw.partialErrors.length : 0;
    const items = [];

    if (nextBookings.length) {
      const next = nextBookings[0];
      items.push({
        id: 'next-booking',
        tone: 'info',
        title: 'Reserva próxima',
        detail: `${formatTime(next.fechaHoraInicio)} · ${next.nombreServicio || next.idServicio || 'Servicio agendado'}`,
      });
    }

    if (pendingBookings.length) {
      items.push({
        id: 'pending-bookings',
        tone: 'warning',
        title: 'Reservas pendientes',
        detail: `${pendingBookings.length} reservas requieren revisión.`,
      });
    }

    if (outStockCount > 0) {
      items.push({
        id: 'out-stock',
        tone: 'danger',
        title: 'Productos sin stock',
        detail: `${outStockCount} productos necesitan reposición inmediata.`,
      });
    }

    if (lowStockCount > 0) {
      items.push({
        id: 'low-stock',
        tone: 'warning',
        title: 'Productos bajo stock',
        detail: `${lowStockCount} productos necesitan reposición.`,
      });
    }

    if (partialErrors > 0) {
      items.push({
        id: 'partial-errors',
        tone: 'warning',
        title: 'Datos incompletos',
        detail: 'Algunos servicios administrativos no respondieron.',
      });
    }

    return items;
  }, [dashboardQuery.metrics]);
  const hasNotifications = notificationItems.length > 0;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  const closeOverlay = () => {
    setIsOpen(false);
    setNotificationsOpen(false);
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
          <div className="admin-topbar-actions">
            <div className="admin-notification-menu" ref={notificationsRef}>
              <button
                type="button"
                className={`admin-icon-button ${hasNotifications ? 'has-notifications' : ''}`}
                aria-label="Ver notificaciones"
                aria-expanded={notificationsOpen}
                aria-controls="admin-notification-panel"
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell size={18} />
                {hasNotifications && <span>{notificationItems.length}</span>}
              </button>
              {notificationsOpen && (
                <div id="admin-notification-panel" className="admin-notification-panel" role="status">
                  <header>
                    <strong>Notificaciones</strong>
                    <small>Reservas, inventario y alertas administrativas</small>
                  </header>
                  {dashboardQuery.isLoading ? (
                    <p className="admin-notification-empty">Cargando notificaciones...</p>
                  ) : hasNotifications ? (
                    <div className="admin-notification-list">
                      {notificationItems.map((item) => (
                        <article key={item.id} className={`admin-notification-item ${item.tone}`}>
                          <span aria-hidden="true" />
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-notification-empty">No hay notificaciones pendientes.</p>
                  )}
                  <footer>
                    <small>Fuente actual: snapshot admin. Endpoint futuro sugerido: GET /api/admin/notificaciones.</small>
                  </footer>
                </div>
              )}
            </div>
            <NavLink to="/admin/agenda" state={{ openNewReservation: true }} className="admin-quick-create">
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

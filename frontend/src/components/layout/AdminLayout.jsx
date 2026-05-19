import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, CalendarRange, CreditCard, Package, Scissors, Users } from 'lucide-react';

const adminLinks = [
  ['/admin', 'Dashboard', BarChart3],
  ['/admin/agenda', 'Agenda', CalendarRange],
  ['/admin/servicios', 'Servicios', Scissors],
  ['/admin/inventario', 'Inventario', Package],
  ['/admin/pagos', 'Pagos', CreditCard],
  ['/admin/clientes', 'Clientes', Users],
];

export function AdminLayout() {
  return (
    <section className="admin-layout">
      <aside>
        <h2>Admin</h2>
        {adminLinks.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}

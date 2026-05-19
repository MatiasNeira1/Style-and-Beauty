import { NavLink, Outlet } from 'react-router-dom';

const adminLinks = [
  ['/admin', 'Dashboard'],
  ['/admin/agenda', 'Agenda'],
  ['/admin/servicios', 'Servicios'],
  ['/admin/inventario', 'Inventario'],
  ['/admin/pagos', 'Pagos'],
  ['/admin/clientes', 'Clientes'],
];

export function AdminLayout() {
  return (
    <section className="admin-layout">
      <aside>
        <h2>Admin</h2>
        {adminLinks.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>
        ))}
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}

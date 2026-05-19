import { DashboardCard } from '../../components/admin/DashboardCard.jsx';

export function AdminDashboard() {
  return (
    <div className="admin-grid">
      <DashboardCard label="Reservas hoy" value="0" />
      <DashboardCard label="Pagos pendientes" value="0" />
      <DashboardCard label="Clientes" value="0" />
    </div>
  );
}

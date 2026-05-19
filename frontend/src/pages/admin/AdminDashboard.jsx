import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CreditCard, Package, Users } from 'lucide-react';
import { DashboardCard } from '../../components/admin/DashboardCard.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { agendaService } from '../../services/agendaService.js';
import { inventoryService } from '../../services/inventoryService.js';
import { paymentService } from '../../services/paymentService.js';

export function AdminDashboard() {
  const bookings = useQuery({ queryKey: ['admin-bookings'], queryFn: agendaService.listBookings });
  const products = useQuery({ queryKey: ['admin-products'], queryFn: inventoryService.listProducts });
  const payments = useQuery({ queryKey: ['admin-payments'], queryFn: paymentService.listTransactions });

  return (
    <div className="stack">
      <SectionTitle eyebrow="Operacion" title="Dashboard admin" />
      <div className="admin-grid">
        <DashboardCard icon={CalendarCheck} label="Reservas" value={bookings.data?.length || 0} />
        <DashboardCard icon={Package} label="Productos" value={products.data?.length || 0} />
        <DashboardCard icon={CreditCard} label="Transacciones" value={payments.data?.length || 0} />
        <DashboardCard icon={Users} label="Clientes" value="-" />
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CreditCard, Package, Scissors, TrendingUp, Users } from 'lucide-react';
import { adminDashboardMock } from '../../mocks/adminDashboardMock.js';
import { adminDashboardService } from '../../services/adminDashboardService.js';
import { formatCurrencyCLP, fullName } from '../../utils/adminFormatters.js';

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isSameMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function getAmount(payment) {
  return Number(payment.monto || payment.montoTotal || payment.total || payment.valor || 0);
}

function paidStatus(payment) {
  return ['APROBADO', 'PAGADO', 'COMPLETADO', 'EXITOSO'].includes(String(payment.estado || '').toUpperCase());
}

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id;
}

function getBookingServiceId(booking) {
  return booking.idServicio || booking.servicioId || booking.id_servicio;
}

function getStaffId(staff) {
  return staff.idPersona || staff.idStaff || staff.id;
}

export function useAdminDashboardMetrics() {
  const query = useQuery({
    queryKey: ['admin-dashboard-snapshot'],
    queryFn: adminDashboardService.getSnapshot,
  });

  const metrics = useMemo(() => {
    const snapshot = query.data || {};
    const bookings = snapshot.bookings || [];
    const services = snapshot.services || [];
    const payments = snapshot.payments || [];
    const products = snapshot.products || [];
    const stock = snapshot.stock || [];
    const clients = snapshot.clients || [];
    const staff = snapshot.staff || [];

    const todayBookings = bookings.filter((booking) => isToday(booking.fechaHoraInicio));
    const pendingBookings = bookings.filter((booking) => String(booking.estadoCita).toUpperCase().includes('PENDIENTE'));
    const confirmedBookings = bookings.filter((booking) => String(booking.estadoCita).toUpperCase() === 'CONFIRMADA');
    const cancelledBookings = bookings.filter((booking) => String(booking.estadoCita).toUpperCase() === 'CANCELADA');
    const finishedBookings = bookings.filter((booking) => ['FINALIZADA', 'COMPLETADA'].includes(String(booking.estadoCita).toUpperCase()));
    const paidPayments = payments.filter(paidStatus);
    const dayRevenue = paidPayments.filter((payment) => isToday(payment.fechaCreacion || payment.fechaPago || payment.createdAt)).reduce((total, payment) => total + getAmount(payment), 0);
    const monthRevenue = paidPayments.filter((payment) => isSameMonth(payment.fechaCreacion || payment.fechaPago || payment.createdAt)).reduce((total, payment) => total + getAmount(payment), 0);
    const totalRevenue = paidPayments.reduce((total, payment) => total + getAmount(payment), 0);
    const pendingRevenue = payments.filter((payment) => String(payment.estado || '').toUpperCase().includes('PENDIENTE')).reduce((total, payment) => total + getAmount(payment), 0);
    const averageTicket = paidPayments.length ? totalRevenue / paidPayments.length : 0;
    const occupancy = bookings.length ? Math.round(((confirmedBookings.length + finishedBookings.length) / bookings.length) * 100) : 0;

    const serviceById = services.reduce((acc, service) => {
      acc[getServiceId(service)] = service;
      return acc;
    }, {});

    const serviceDistribution = bookings.reduce((acc, booking) => {
      const service = serviceById[getBookingServiceId(booking)];
      const name = service?.categoria || service?.nombre || 'Sin categoria';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const staffPerformance = staff.map((member) => {
      const id = getStaffId(member);
      const reservations = bookings.filter((booking) => String(booking.idStaff) === String(id));
      const revenue = reservations.reduce((total, booking) => {
        const service = serviceById[getBookingServiceId(booking)];
        return total + Number(service?.precio_total || service?.precioTotal || 0);
      }, 0);
      return {
        id,
        name: fullName(member) || 'Profesional',
        specialty: member.especialidad?.nombre || member.nombreEspecialidad || 'Especialista',
        reservations: reservations.length,
        ingresos: revenue,
        status: reservations.length >= 6 ? 'Agenda llena' : reservations.length ? 'En atencion' : 'Disponible hoy',
        nextBooking: reservations.sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio))[0],
      };
    }).sort((a, b) => b.ingresos - a.ingresos);

    const lowStock = stock.filter((item) => Number(item.cantidadActual || 0) <= Number(item.stockMinimo || 0));
    const statusTotal = Math.max(bookings.length, 1);

    return {
      kpis: [
        { icon: CalendarCheck, title: 'Reservas hoy', value: todayBookings.length, trend: 12, microcopy: `${pendingBookings.length} pendientes por confirmar`, tone: 'rose' },
        { icon: TrendingUp, title: 'Ingresos mes', value: formatCurrencyCLP(monthRevenue || totalRevenue), trend: 18, microcopy: `${formatCurrencyCLP(dayRevenue)} recaudado hoy`, tone: 'gold' },
        { icon: Users, title: 'Profesionales activos', value: staff.length, trend: 4, microcopy: `${staffPerformance.filter((item) => item.status !== 'Disponible hoy').length} con agenda en movimiento`, tone: 'sage' },
        { icon: CreditCard, title: 'Ticket promedio', value: formatCurrencyCLP(averageTicket), trend: 6, microcopy: `${formatCurrencyCLP(pendingRevenue)} pendiente por cobrar`, tone: 'ink' },
        { icon: Scissors, title: 'Servicios vendidos', value: bookings.length, trend: 9, microcopy: `${services.length} servicios administrables`, tone: 'rose' },
        { icon: Package, title: 'Bajo stock', value: lowStock.length, trend: lowStock.length ? -8 : 0, microcopy: `${products.length} productos en catalogo`, tone: 'gold' },
      ],
      revenueSeries: adminDashboardMock.revenueSeries,
      weeklyOccupancy: adminDashboardMock.weeklyOccupancy,
      serviceDistribution: Object.entries(serviceDistribution).map(([name, value]) => ({ name, value })).slice(0, 6),
      staffPerformance: staffPerformance.slice(0, 5),
      professionalsToday: staffPerformance.slice(0, 6),
      nextBookings: bookings
        .filter((booking) => new Date(booking.fechaHoraInicio) >= new Date())
        .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio))
        .slice(0, 5),
      appointmentStatus: [
        { name: 'Confirmadas', value: confirmedBookings.length, percent: Math.round((confirmedBookings.length / statusTotal) * 100) },
        { name: 'Pendientes', value: pendingBookings.length, percent: Math.round((pendingBookings.length / statusTotal) * 100) },
        { name: 'Finalizadas', value: finishedBookings.length, percent: Math.round((finishedBookings.length / statusTotal) * 100) },
        { name: 'Canceladas', value: cancelledBookings.length, percent: Math.round((cancelledBookings.length / statusTotal) * 100) },
      ],
      alerts: [
        pendingBookings.length ? `${pendingBookings.length} reservas requieren confirmacion` : 'Reservas pendientes bajo control',
        pendingRevenue ? `${formatCurrencyCLP(pendingRevenue)} pendiente por cobrar` : 'Pagos pendientes sin alerta',
        lowStock.length ? `${lowStock.length} productos bajo stock minimo` : 'Inventario sin quiebres criticos',
        occupancy >= 80 ? `Ocupacion alta: ${occupancy}%` : `Ocupacion agenda: ${occupancy}%`,
      ],
      raw: { bookings, services, payments, products, stock, clients, staff },
    };
  }, [query.data]);

  return { ...query, metrics };
}

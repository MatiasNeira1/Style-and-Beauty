import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Scissors,
  Users,
} from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { paymentService } from '../../services/paymentService.js';
import { profileService } from '../../services/profileService.js';

const completedStatuses = new Set(['FINALIZADA', 'FINALIZADO']);
const finalizableStatuses = new Set(['CONFIRMADA', 'EN_ATENCION']);
const paidStatuses = new Set(['APROBADA', 'PAGADO', 'PAGADA', 'COMPLETADO', 'COMPLETADA', 'EXITOSO', 'EXITOSA']);
const dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const statusDefinitions = [
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'finalized', label: 'Finalizadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

function staffIds(staff) {
  return [staff?.idStaff, staff?.idPersona, staff?.id]
    .filter(Boolean)
    .map((id) => String(id));
}

function primaryStaffId(staff) {
  return staff?.idStaff || staff?.idPersona || staff?.id;
}

function entityId(entity, keys) {
  return keys.map((key) => entity?.[key]).find(Boolean);
}

function sameId(left, right) {
  return left && right && String(left) === String(right);
}

function matchesAnyId(id, ids) {
  return Boolean(id && ids.includes(String(id)));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfWeek(date) {
  const next = startOfDay(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function inRange(value, start, end) {
  const date = parseDate(value);
  return Boolean(date && date >= start && date < end);
}

function currency(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function fullName(person) {
  if (!person) return null;
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || person.emailContacto || null;
}

function paymentStatus(payment) {
  return String(payment?.estadoPago || payment?.estado || '').toUpperCase();
}

function isPaid(payment) {
  return paidStatuses.has(paymentStatus(payment));
}

function paymentAmount(payment) {
  return Number(payment?.montoTotal ?? payment?.monto ?? payment?.total ?? 0);
}

function paymentBookingIds(payment) {
  const ids = [
    entityId(payment, ['idCita', 'id_cita', 'idReserva']),
  ].filter(Boolean);

  const rawIds = payment?.idCitas || payment?.id_citas;
  if (Array.isArray(rawIds)) {
    rawIds.forEach((id) => {
      if (id) ids.push(id);
    });
  } else if (typeof rawIds === 'string' && rawIds.trim()) {
    try {
      const parsed = JSON.parse(rawIds);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (id) ids.push(id);
        });
      } else {
        rawIds.split(',').forEach((id) => {
          if (id.trim()) ids.push(id.trim());
        });
      }
    } catch {
      rawIds.split(',').forEach((id) => {
        if (id.trim()) ids.push(id.trim());
      });
    }
  }

  return Array.from(new Set(ids.map(String)));
}

function paymentAmountForBooking(payment) {
  const ids = paymentBookingIds(payment);
  const divisor = Math.max(ids.length, 1);
  return paymentAmount(payment) / divisor;
}

function paymentAmountForStaff(payment, bookingsById) {
  const ids = paymentBookingIds(payment);
  if (!ids.length) return 0;
  const matchedCount = ids.filter((bookingId) => bookingsById[String(bookingId)]).length;
  return (paymentAmount(payment) / ids.length) * matchedCount;
}

function bookingDate(booking) {
  return booking?.fechaHoraInicio || booking?.fecha || booking?.createdAt;
}

function bookingStatus(booking) {
  return String(booking?.estadoCita || booking?.estado || '').toUpperCase();
}

function statusBucket(status) {
  if (status.includes('FINAL')) return 'finalized';
  if (status.includes('CANCEL')) return 'cancelled';
  if (status.includes('CONFIRM')) return 'confirmed';
  if (status.includes('PEND')) return 'pending';
  return 'pending';
}

function canFinalizeBooking(row) {
  return Boolean(row?.id && finalizableStatuses.has(String(row.estado || '').toUpperCase()));
}

function ChartBars({ title, subtitle, data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="staff-dashboard-panel">
      <div className="staff-dashboard-panel-header">
        <div>
          <span>Ganancias</span>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="staff-chart">
        {data.map((item) => {
          const height = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 2);
          return (
            <div className="staff-chart-item" key={item.label}>
              <div className="staff-chart-track" title={`${item.label}: ${currency(item.value)}`}>
                <span style={{ height: `${height}%` }} />
              </div>
              <strong>{item.label}</strong>
              <small>{currency(item.value)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="staff-dashboard-card">
      <div className="staff-dashboard-card-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

function StatusPanel({ items }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);

  return (
    <section className="staff-status-panel">
      <div className="staff-dashboard-panel-header">
        <div>
          <span>Estado operativo</span>
          <h3>Reservas por etapa</h3>
          <p>Lectura del estado actual de tu agenda.</p>
        </div>
        <Activity size={18} />
      </div>
      <div className="staff-status-list">
        {items.map((item) => {
          const width = (item.value / total) * 100;
          return (
            <div className="staff-status-item" key={item.key}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="staff-status-track">
                <span style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReadOnlyTable({
  eyebrow,
  title,
  rows,
  emptyMessage = 'No hay registros para mostrar.',
  onFinalize,
  finalizingId,
}) {
  const columns = [
    { key: 'fecha', label: 'Fecha', render: (row) => formatDateTime(row.fecha) },
    { key: 'cliente', label: 'Cliente' },
    { key: 'servicio', label: 'Servicio' },
    { key: 'profesional', label: 'Profesional' },
    { key: 'estado', label: 'Estado' },
    { key: 'precio', label: 'Precio', render: (row) => currency(row.precio) },
  ];

  if (onFinalize) {
    columns.push({
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        canFinalizeBooking(row) ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onFinalize(row.id)}
            disabled={finalizingId === row.id}
          >
            <CheckCircle2 size={14} />
            {finalizingId === row.id ? 'Finalizando' : 'Finalizar'}
          </Button>
        ) : (
          <span className="staff-table-muted-action">Sin accion</span>
        )
      ),
    });
  }

  return (
    <section className="staff-dashboard-panel">
      <div className="staff-dashboard-panel-header">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>
      <DataTable
        emptyMessage={emptyMessage}
        columns={columns}
        rows={rows}
      />
    </section>
  );
}

export function StaffDashboard({ currentStaff, fullName: professionalName, view = 'dashboard' }) {
  const queryClient = useQueryClient();
  const currentStaffIds = useMemo(() => staffIds(currentStaff), [currentStaff]);
  const currentStaffId = primaryStaffId(currentStaff);

  const bookingsQuery = useQuery({
    queryKey: ['staff-dashboard-bookings', currentStaffId],
    queryFn: agendaService.listMyStaffBookings,
    enabled: Boolean(currentStaffId),
  });

  const clientsQuery = useQuery({
    queryKey: ['staff-dashboard-clients'],
    queryFn: profileService.listClients,
  });

  const servicesQuery = useQuery({
    queryKey: ['staff-dashboard-services'],
    queryFn: catalogService.listServices,
  });

  const paymentsQuery = useQuery({
    queryKey: ['staff-dashboard-payments'],
    queryFn: paymentService.listTransactions,
  });

  const finalizeBookingMutation = useMutation({
    mutationFn: agendaService.finalizeMyBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-bookings', currentStaffId] });
      queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const {
    todayBookings,
    weekBookings,
    monthClients,
    servicesDone,
    historyRows,
    todayRows,
    weekRows,
    statusSummary,
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
  } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const weekStart = startOfWeek(now);
    const nextWeekStart = addDays(weekStart, 7);
    const monthStart = startOfMonth(now);
    const nextMonthStart = addMonths(monthStart, 1);

    const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
    const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];
    const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
    const payments = Array.isArray(paymentsQuery.data) ? paymentsQuery.data : [];

    const clientsById = clients.reduce((acc, client) => {
      const id = entityId(client, ['idPersona', 'idCliente', 'id']);
      if (id) acc[String(id)] = client;
      return acc;
    }, {});

    const servicesById = services.reduce((acc, service) => {
      const id = entityId(service, ['id_servicio', 'idServicio', 'id']);
      if (id) acc[String(id)] = service;
      return acc;
    }, {});

    const staffBookings = bookings.filter((booking) => {
      const id = entityId(booking, ['idStaff', 'staffId', 'idProfesional', 'idPersonaStaff']);
      return matchesAnyId(id, currentStaffIds);
    });

    const bookingsById = staffBookings.reduce((acc, booking) => {
      const id = entityId(booking, ['idCita', 'id', 'idReserva']);
      if (id) acc[String(id)] = booking;
      return acc;
    }, {});

    const paidPayments = payments.filter((payment) => {
      const bookingIds = paymentBookingIds(payment);
      return isPaid(payment) && bookingIds.some((bookingId) => bookingsById[String(bookingId)]);
    });

    const today = staffBookings.filter((booking) => inRange(bookingDate(booking), todayStart, tomorrowStart));
    const week = staffBookings.filter((booking) => inRange(bookingDate(booking), weekStart, nextWeekStart));
    const completedMonth = staffBookings.filter((booking) => (
      completedStatuses.has(bookingStatus(booking))
      && inRange(bookingDate(booking), monthStart, nextMonthStart)
    ));

    const attendedClients = new Set(
      completedMonth
        .map((booking) => entityId(booking, ['idCliente', 'idPersonaCliente', 'clienteId']))
        .filter(Boolean),
    );

    const rows = staffBookings
      .slice()
      .sort((left, right) => {
        const rightDate = parseDate(bookingDate(right))?.getTime() || 0;
        const leftDate = parseDate(bookingDate(left))?.getTime() || 0;
        return rightDate - leftDate;
      })
      .map((booking) => {
        const clientId = entityId(booking, ['idCliente', 'idPersonaCliente', 'clienteId']);
        const serviceId = entityId(booking, ['idServicio', 'id_servicio', 'servicioId']);
        const bookingId = entityId(booking, ['idCita', 'id', 'idReserva']);
        const service = servicesById[String(serviceId)] || {};
        const payment = payments.find((item) => {
          return paymentBookingIds(item).some((paymentBookingId) => sameId(paymentBookingId, bookingId)) && isPaid(item);
        });
        const price = payment
          ? paymentAmountForBooking(payment)
          : Number(service.precio_total ?? service.precioTotal ?? service.precio ?? 0);

        return {
          id: bookingId,
          fecha: bookingDate(booking),
          cliente: booking.nombreCliente || fullName(clientsById[String(clientId)]) || clientId || 'Sin cliente',
          servicio: booking.nombreServicio || service.nombre || service.nombreServicio || serviceId || 'Sin servicio',
          profesional: professionalName,
          estado: booking.estadoCita || booking.estado || 'Sin estado',
          precio: price,
        };
      });

    const rowsAscending = rows
      .slice()
      .sort((left, right) => {
        const leftDate = parseDate(left.fecha)?.getTime() || 0;
        const rightDate = parseDate(right.fecha)?.getTime() || 0;
        return leftDate - rightDate;
      });

    const buildRevenue = (ranges) => ranges.map((range) => ({
      label: range.label,
      value: paidPayments.reduce((sum, payment) => {
        const booking = paymentBookingIds(payment)
          .map((bookingId) => bookingsById[String(bookingId)])
          .find(Boolean);
        const date = payment.fechaPago || payment.createdAt || bookingDate(booking);
        return inRange(date, range.start, range.end) ? sum + paymentAmountForStaff(payment, bookingsById) : sum;
      }, 0),
    }));

    const dailyRanges = Array.from({ length: 7 }, (_, index) => {
      const start = addDays(weekStart, index);
      return {
        label: dayLabels[index],
        start,
        end: addDays(start, 1),
      };
    });

    const weeklyRanges = Array.from({ length: 4 }, (_, index) => {
      const start = addDays(weekStart, (index - 3) * 7);
      return {
        label: index === 3 ? 'Esta' : `S-${3 - index}`,
        start,
        end: addDays(start, 7),
      };
    });

    const monthlyRanges = Array.from({ length: 6 }, (_, index) => {
      const start = startOfMonth(addMonths(now, index - 5));
      return {
        label: new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(start),
        start,
        end: addMonths(start, 1),
      };
    });

    const statusCounts = staffBookings.reduce((acc, booking) => {
      const bucket = statusBucket(bookingStatus(booking));
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {});

    return {
      todayBookings: today,
      weekBookings: week,
      monthClients: attendedClients.size,
      servicesDone: completedMonth.length,
      historyRows: rows,
      todayRows: rowsAscending.filter((row) => inRange(row.fecha, todayStart, tomorrowStart)),
      weekRows: rowsAscending.filter((row) => inRange(row.fecha, weekStart, nextWeekStart)),
      statusSummary: statusDefinitions.map((definition) => ({
        ...definition,
        value: statusCounts[definition.key] || 0,
      })),
      dailyRevenue: buildRevenue(dailyRanges),
      weeklyRevenue: buildRevenue(weeklyRanges),
      monthlyRevenue: buildRevenue(monthlyRanges),
    };
  }, [bookingsQuery.data, clientsQuery.data, currentStaffIds, paymentsQuery.data, professionalName, servicesQuery.data]);

  const isLoading = bookingsQuery.isLoading || servicesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="staff-dashboard-loader">
        <Loader />
      </div>
    );
  }

  const alerts = (
    <>
      {bookingsQuery.isError && (
        <p className="admin-alert">
          Agenda no disponible. Se mostraran metricas e historial vacios hasta que el servicio responda.
        </p>
      )}

      {servicesQuery.isError && (
        <p className="admin-alert">
          Catalogo no disponible para enriquecer servicios. Se mostraran identificadores internos cuando corresponda.
        </p>
      )}

      {paymentsQuery.isError && (
        <p className="admin-alert">
          Pagos no disponible para graficos de ganancias. El panel continua en modo consulta con montos en cero.
        </p>
      )}

      {clientsQuery.isError && (
        <p className="admin-alert">
          Clientes no disponible para enriquecer el historial. Se mostraran identificadores internos cuando corresponda.
        </p>
      )}

      {finalizeBookingMutation.isError && (
        <p className="admin-alert">
          {finalizeBookingMutation.error?.message || 'No se pudo finalizar la cita. Intenta nuevamente.'}
        </p>
      )}
    </>
  );

  const finalizingId = finalizeBookingMutation.isPending ? finalizeBookingMutation.variables : null;
  const handleFinalizeBooking = (idCita) => finalizeBookingMutation.mutate(idCita);

  if (view === 'agenda') {
    return (
      <div className="staff-dashboard">
        <div className="staff-dashboard-grid staff-dashboard-grid-compact">
          <MetricCard icon={CalendarCheck} label="Citas para hoy" value={todayBookings.length} hint="Asignadas a tu agenda" />
          <MetricCard icon={CalendarDays} label="Citas de la semana" value={weekBookings.length} hint="Lunes a domingo" />
        </div>
        {alerts}
        <div className="staff-agenda-grid">
          <ReadOnlyTable
            eyebrow="Hoy"
            title="Citas para hoy"
            rows={todayRows}
            emptyMessage="No tienes citas asignadas para hoy."
            onFinalize={handleFinalizeBooking}
            finalizingId={finalizingId}
          />
          <ReadOnlyTable
            eyebrow="Semana"
            title="Citas de la semana"
            rows={weekRows}
            emptyMessage="No tienes citas asignadas esta semana."
            onFinalize={handleFinalizeBooking}
            finalizingId={finalizingId}
          />
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="staff-dashboard">
        {alerts}
        <ReadOnlyTable
          eyebrow="Historial"
          title="Servicios y citas asignadas"
          rows={historyRows}
          emptyMessage="Aun no hay servicios asociados a tu agenda."
          onFinalize={handleFinalizeBooking}
          finalizingId={finalizingId}
        />
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-grid">
        <MetricCard icon={CalendarCheck} label="Citas para hoy" value={todayBookings.length} hint="Asignadas a tu agenda" />
        <MetricCard icon={CalendarDays} label="Citas de la semana" value={weekBookings.length} hint="Lunes a domingo" />
        <MetricCard icon={Users} label="Clientes atendidos" value={monthClients} hint="Mes actual" />
        <MetricCard icon={Scissors} label="Servicios realizados" value={servicesDone} hint="Citas finalizadas" />
      </div>

      {alerts}

      <div className="staff-dashboard-main-grid">
        <ChartBars title="Ganancias diarias" subtitle="Pagos aprobados asociados a tus citas." data={dailyRevenue} />
        <StatusPanel items={statusSummary} />
      </div>

      <div className="staff-dashboard-charts">
        <ChartBars title="Ganancias semanales" subtitle="Comparativo de las ultimas cuatro semanas." data={weeklyRevenue} />
        <ChartBars title="Ganancias mensuales" subtitle="Comparativo de los ultimos seis meses." data={monthlyRevenue} />
      </div>

      <ReadOnlyTable
        eyebrow="Historial"
        title="Servicios y citas asignadas"
        rows={historyRows}
        emptyMessage="Aun no hay servicios asociados a tu agenda."
        onFinalize={handleFinalizeBooking}
        finalizingId={finalizingId}
      />
    </div>
  );
}

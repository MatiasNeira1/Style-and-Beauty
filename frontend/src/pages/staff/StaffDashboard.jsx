import { useMemo, useState } from 'react';
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
import { Modal } from '../../components/ui/Modal.jsx';
import { agendaService } from '../../services/agendaService.js';
import { profileService } from '../../services/profileService.js';

const completedStatuses = new Set(['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'COMPLETADO', 'ATENDIDA', 'ATENDIDO']);
const finalizableStatuses = new Set(['CONFIRMADA', 'CONFIRMADO']);
const dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const insufficientDataMessage = 'Aun no hay datos suficientes para generar este grafico.';
const numberFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
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

function bookingDate(booking) {
  return booking?.fechaHoraInicio || booking?.fecha || booking?.createdAt;
}

function bookingStatus(booking) {
  return String(booking?.estadoCita || booking?.estado || '').toUpperCase();
}

function bookingServiceName(booking) {
  return (
    booking?.nombreServicio
    || booking?.servicio?.nombre
    || booking?.servicio?.nombreServicio
    || entityId(booking, ['idServicio', 'id_servicio', 'servicioId'])
    || 'Sin servicio'
  );
}

function statusBucket(status) {
  if (status.includes('FINAL') || status.includes('COMPLET') || status.includes('ATEND')) return 'finalized';
  if (status.includes('CANCEL')) return 'cancelled';
  if (status.includes('CONFIRM')) return 'confirmed';
  if (status.includes('PEND')) return 'pending';
  return 'pending';
}

function canFinalizeBooking(row) {
  return Boolean(row?.id && finalizableStatuses.has(String(row.estado || '').toUpperCase()));
}

function buildRangeCounts(bookings, ranges, filter = () => true) {
  return ranges.map((range) => ({
    label: range.label,
    value: bookings.reduce((sum, booking) => (
      filter(booking) && inRange(bookingDate(booking), range.start, range.end) ? sum + 1 : sum
    ), 0),
  }));
}

function ChartBars({ eyebrow = 'Actividad', title, subtitle, data }) {
  const hasData = data.some((item) => Number(item.value) > 0);
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);

  return (
    <section className="staff-dashboard-panel">
      <div className="staff-dashboard-panel-header">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {hasData ? (
        <div className="staff-chart" role="img" aria-label={title}>
          {data.map((item) => {
            const value = Number(item.value) || 0;
            const height = Math.max((value / max) * 100, value > 0 ? 8 : 2);
            return (
              <div className="staff-chart-item" key={item.label}>
                <div className="staff-chart-track" title={`${item.label}: ${numberFormatter.format(value)}`}>
                  <span style={{ height: `${height}%` }} />
                </div>
                <strong>{item.label}</strong>
                <small>{numberFormatter.format(value)}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="staff-chart-empty">
          <Activity size={18} />
          <p>{insufficientDataMessage}</p>
        </div>
      )}
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
  const total = items.reduce((sum, item) => sum + item.value, 0);

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
      {total > 0 ? (
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
      ) : (
        <div className="staff-chart-empty compact">
          <Activity size={18} />
          <p>{insufficientDataMessage}</p>
        </div>
      )}
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
  scrollable = false,
}) {
  const columns = [
    { key: 'fecha', label: 'Fecha', render: (row) => formatDateTime(row.fecha) },
    { key: 'cliente', label: 'Cliente' },
    { key: 'servicio', label: 'Servicio' },
    { key: 'profesional', label: 'Profesional' },
    { key: 'estado', label: 'Estado' },
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
            onClick={() => onFinalize(row)}
            disabled={finalizingId === row.id}
          >
            <CheckCircle2 size={14} />
            {finalizingId === row.id ? 'Finalizando...' : 'Finalizar cita'}
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
      <div className={scrollable ? 'staff-history-scroll' : undefined}>
        <DataTable
          emptyMessage={emptyMessage}
          columns={columns}
          rows={rows}
        />
      </div>
    </section>
  );
}

export function StaffDashboard({ currentStaff, fullName: professionalName, view = 'dashboard' }) {
  const queryClient = useQueryClient();
  const [bookingToFinalize, setBookingToFinalize] = useState(null);
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

  const finalizeBookingMutation = useMutation({
    mutationFn: agendaService.finalizeMyBooking,
    onSuccess: () => {
      setBookingToFinalize(null);
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-bookings', currentStaffId] });
      queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    },
  });

  const {
    todayBookings,
    weekBookings,
    nextWeekBookings,
    monthClients,
    servicesDone,
    historyRows,
    todayRows,
    weekRows,
    nextWeekRows,
    statusSummary,
    dailyActivity,
    weeklyActivity,
    monthlyActivity,
    topServices,
  } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const weekStart = startOfWeek(now);
    const nextWeekStart = addDays(weekStart, 7);
    const nextWeekEnd = addDays(nextWeekStart, 7);
    const monthStart = startOfMonth(now);
    const nextMonthStart = addMonths(monthStart, 1);

    const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
    const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];

    const clientsById = clients.reduce((acc, client) => {
      const id = entityId(client, ['idPersona', 'idCliente', 'id']);
      if (id) acc[String(id)] = client;
      return acc;
    }, {});

    const staffBookings = bookings.filter((booking) => {
      const id = entityId(booking, ['idStaff', 'staffId', 'idProfesional', 'idPersonaStaff']);
      return !id || matchesAnyId(id, currentStaffIds);
    });

    const today = staffBookings.filter((booking) => inRange(bookingDate(booking), todayStart, tomorrowStart));
    const week = staffBookings.filter((booking) => inRange(bookingDate(booking), weekStart, nextWeekStart));
    const nextWeek = staffBookings.filter((booking) => inRange(bookingDate(booking), nextWeekStart, nextWeekEnd));
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
        const bookingId = entityId(booking, ['idCita', 'id', 'idReserva']);

        return {
          id: bookingId,
          fecha: bookingDate(booking),
          cliente: booking.nombreCliente || booking.clienteNombre || fullName(clientsById[String(clientId)]) || clientId || 'Sin cliente',
          servicio: bookingServiceName(booking),
          profesional: professionalName,
          estado: booking.estadoCita || booking.estado || 'Sin estado',
        };
      });

    const rowsAscending = rows
      .slice()
      .sort((left, right) => {
        const leftDate = parseDate(left.fecha)?.getTime() || 0;
        const rightDate = parseDate(right.fecha)?.getTime() || 0;
        return leftDate - rightDate;
      });

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

    const completedBookings = staffBookings.filter((booking) => completedStatuses.has(bookingStatus(booking)));
    const serviceCounts = completedBookings.reduce((acc, booking) => {
      const name = bookingServiceName(booking);
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return {
      todayBookings: today,
      weekBookings: week,
      nextWeekBookings: nextWeek,
      monthClients: attendedClients.size,
      servicesDone: completedMonth.length,
      historyRows: rows,
      todayRows: rowsAscending.filter((row) => inRange(row.fecha, todayStart, tomorrowStart)),
      weekRows: rowsAscending.filter((row) => inRange(row.fecha, weekStart, nextWeekStart)),
      nextWeekRows: rowsAscending.filter((row) => inRange(row.fecha, nextWeekStart, nextWeekEnd)),
      statusSummary: statusDefinitions.map((definition) => ({
        ...definition,
        value: statusCounts[definition.key] || 0,
      })),
      dailyActivity: buildRangeCounts(staffBookings, dailyRanges),
      weeklyActivity: buildRangeCounts(staffBookings, weeklyRanges, (booking) => completedStatuses.has(bookingStatus(booking))),
      monthlyActivity: buildRangeCounts(staffBookings, monthlyRanges, (booking) => completedStatuses.has(bookingStatus(booking))),
      topServices: Object.entries(serviceCounts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value })),
    };
  }, [bookingsQuery.data, clientsQuery.data, currentStaffIds, professionalName]);

  if (bookingsQuery.isLoading) {
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
  const handleOpenFinalizeModal = (booking) => setBookingToFinalize(booking);
  const handleConfirmFinalizeBooking = () => {
    if (!bookingToFinalize?.id) return;
    finalizeBookingMutation.mutate(bookingToFinalize.id);
  };
  const finalizeConfirmationModal = (
    <Modal
      open={Boolean(bookingToFinalize)}
      title="Finalizar cita"
      onClose={() => {
        if (!finalizeBookingMutation.isPending) {
          setBookingToFinalize(null);
        }
      }}
    >
      {bookingToFinalize && (
        <div className="staff-finalize-dialog">
          <CheckCircle2 size={28} />
          <div>
            <h3>Confirmar finalizacion</h3>
            <p>
              Esta accion marcara como finalizada la cita de <strong>{bookingToFinalize.cliente}</strong> para el servicio <strong>{bookingToFinalize.servicio}</strong>.
            </p>
            <span>{formatDateTime(bookingToFinalize.fecha)}</span>
          </div>
          {finalizeBookingMutation.isError && (
            <p className="admin-alert">
              {finalizeBookingMutation.error?.message || 'No se pudo finalizar la cita. Intenta nuevamente.'}
            </p>
          )}
          <div className="staff-finalize-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBookingToFinalize(null)}
              disabled={finalizeBookingMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmFinalizeBooking}
              disabled={finalizeBookingMutation.isPending}
            >
              <CheckCircle2 size={14} />
              {finalizeBookingMutation.isPending ? 'Finalizando...' : 'Confirmar finalizacion'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );

  if (view === 'agenda') {
    return (
      <div className="staff-dashboard">
        <div className="staff-dashboard-grid staff-dashboard-grid-compact">
          <MetricCard icon={CalendarCheck} label="Citas para hoy" value={todayBookings.length} hint="Asignadas a tu agenda" />
          <MetricCard icon={CalendarDays} label="Citas de la semana" value={weekBookings.length} hint="Lunes a domingo" />
          <MetricCard icon={CalendarDays} label="Citas proxima semana" value={nextWeekBookings.length} hint="Lunes a domingo siguiente" />
        </div>
        {alerts}
        <div className="staff-agenda-grid">
          <ReadOnlyTable
            eyebrow="Hoy"
            title="Citas para hoy"
            rows={todayRows}
            emptyMessage="No tienes citas asignadas para hoy."
            onFinalize={handleOpenFinalizeModal}
            finalizingId={finalizingId}
          />
          <ReadOnlyTable
            eyebrow="Semana"
            title="Citas de la semana"
            rows={weekRows}
            emptyMessage="No tienes citas asignadas esta semana."
            onFinalize={handleOpenFinalizeModal}
            finalizingId={finalizingId}
          />
          <ReadOnlyTable
            eyebrow="Proxima semana"
            title="Citas para la proxima semana"
            rows={nextWeekRows}
            emptyMessage="No tienes citas asignadas para la proxima semana."
            onFinalize={handleOpenFinalizeModal}
            finalizingId={finalizingId}
          />
        </div>
        {finalizeConfirmationModal}
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="staff-dashboard">
        {alerts}
        <ReadOnlyTable
          eyebrow="Historial"
          title="Historial de citas"
          rows={historyRows}
          emptyMessage="Aun no hay historial de citas para mostrar."
          onFinalize={handleOpenFinalizeModal}
          finalizingId={finalizingId}
          scrollable
        />
        {finalizeConfirmationModal}
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-grid">
        <MetricCard icon={CalendarCheck} label="Citas para hoy" value={todayBookings.length} hint="Asignadas a tu agenda" />
        <MetricCard icon={CalendarDays} label="Citas de la semana" value={weekBookings.length} hint="Lunes a domingo" />
        <MetricCard icon={CalendarDays} label="Citas proxima semana" value={nextWeekBookings.length} hint="Lunes a domingo siguiente" />
        <MetricCard icon={Users} label="Clientes atendidos" value={monthClients} hint="Mes actual" />
        <MetricCard icon={Scissors} label="Servicios realizados" value={servicesDone} hint="Citas finalizadas del mes" />
      </div>

      {alerts}

      <div className="staff-dashboard-main-grid">
        <ChartBars
          eyebrow="Agenda real"
          title="Citas por dia"
          subtitle="Citas asignadas durante la semana actual."
          data={dailyActivity}
        />
        <StatusPanel items={statusSummary} />
      </div>

      <div className="staff-dashboard-charts">
        <ChartBars
          eyebrow="Atenciones"
          title="Atenciones semanales"
          subtitle="Citas finalizadas en las ultimas cuatro semanas."
          data={weeklyActivity}
        />
        <ChartBars
          eyebrow="Atenciones"
          title="Atenciones mensuales"
          subtitle="Citas finalizadas en los ultimos seis meses."
          data={monthlyActivity}
        />
        <ChartBars
          eyebrow="Servicios"
          title="Servicios mas realizados"
          subtitle="Ranking basado en citas finalizadas."
          data={topServices}
        />
      </div>

      <ReadOnlyTable
        eyebrow="Proxima semana"
        title="Citas para la proxima semana"
        rows={nextWeekRows}
        emptyMessage="No tienes citas asignadas para la proxima semana."
        onFinalize={handleOpenFinalizeModal}
        finalizingId={finalizingId}
      />

      <ReadOnlyTable
        eyebrow="Historial"
        title="Historial de citas"
        rows={historyRows}
        emptyMessage="Aun no hay historial de citas para mostrar."
        onFinalize={handleOpenFinalizeModal}
        finalizingId={finalizingId}
        scrollable
      />
      {finalizeConfirmationModal}
    </div>
  );
}

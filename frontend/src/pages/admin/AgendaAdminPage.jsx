import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { DataTable } from '../../components/admin/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';

const statusOptions = ['PENDIENTE_PAGO', 'CONFIRMADA', 'FINALIZADA', 'CANCELADA', 'EXPIRADA', 'RECHAZADA'];

function monthValue() {
  return new Date().toISOString().slice(0, 7);
}

function getBookingId(booking) {
  return booking.idCita || booking.id;
}

function sameLocalMonth(value, selectedMonth) {
  if (!value) return false;
  return new Date(value).toISOString().slice(0, 7) === selectedMonth;
}

function formatTime(value) {
  if (!value) return 'Sin hora';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function fullName(person) {
  if (!person) return null;
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || person.emailContacto || null;
}

export function AgendaAdminPage() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(monthValue());
  const [statusDrafts, setStatusDrafts] = useState({});

  const bookingsQuery = useQuery({ queryKey: ['agenda-admin'], queryFn: agendaService.listBookings });
  const servicesQuery = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });
  const clientsQuery = useQuery({ queryKey: ['profiles-clients'], queryFn: profileService.listClients });
  const staffQuery = useQuery({ queryKey: ['profiles-staff'], queryFn: profileService.listStaff });

  const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];
  const staff = Array.isArray(staffQuery.data) ? staffQuery.data : [];

  const servicesById = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.id_servicio || service.idServicio || service.id] = service;
      return acc;
    }, {});
  }, [services]);

  const clientsById = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.idPersona || client.idCliente || client.id] = client;
      return acc;
    }, {});
  }, [clients]);

  const staffById = useMemo(() => {
    return staff.reduce((acc, member) => {
      acc[member.idPersona || member.idStaff || member.id] = member;
      return acc;
    }, {});
  }, [staff]);

  const monthBookings = useMemo(() => {
    return bookings
      .filter((booking) => sameLocalMonth(booking.fechaHoraInicio, selectedMonth))
      .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
  }, [bookings, selectedMonth]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ idCita, estadoCita }) => agendaService.updateBookingStatus(idCita, { estadoCita }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-admin'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: agendaService.cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda-admin'] }),
  });

  const isLoading = bookingsQuery.isLoading || servicesQuery.isLoading || clientsQuery.isLoading || staffQuery.isLoading;
  const isError = bookingsQuery.isError || servicesQuery.isError || clientsQuery.isError || staffQuery.isError;
  const error = bookingsQuery.error || servicesQuery.error || clientsQuery.error || staffQuery.error;

  const confirmedCount = monthBookings.filter((booking) => booking.estadoCita === 'CONFIRMADA').length;
  const pendingCount = monthBookings.filter((booking) => booking.estadoCita === 'PENDIENTE_PAGO').length;
  const cancelledCount = monthBookings.filter((booking) => booking.estadoCita === 'CANCELADA').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Administracion</span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1">Agenda mensual</h1>
          <p className="text-sm text-ink-soft mt-1">Revisa las citas programadas del mes y actualiza su estado.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl text-primary font-bold text-sm">
          <CalendarRange size={16} />
          <span>{monthBookings.length} Citas</span>
        </div>
      </div>

      <div className="card stack">
        <div className="form-grid">
          <Input label="Mes agenda" id="agenda-month" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value || monthValue())} />
          <div className="field">
            <span>Resumen</span>
            <div className="flex flex-wrap gap-2">
              <span className="badge">Total: {monthBookings.length}</span>
              <span className="badge">Confirmadas: {confirmedCount}</span>
              <span className="badge">Pendientes: {pendingCount}</span>
              <span className="badge">Canceladas: {cancelledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <p className="admin-alert">{error.message}</p>
      ) : (
        <DataTable
          columns={[
            {
              key: 'fecha',
              label: 'Fecha',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{formatDate(row.fechaHoraInicio)}</span>
                  <span className="text-xs text-primary font-bold">{formatTime(row.fechaHoraInicio)} - {formatTime(row.fechaHoraFin)}</span>
                </div>
              ),
            },
            {
              key: 'horario',
              label: 'Horario',
              render: (row) => (
                <div className="flex flex-col">
                  <span className="font-bold text-ink">{formatTime(row.fechaHoraInicio)} - {formatTime(row.fechaHoraFin)}</span>
                  <span className="text-xs text-ink-soft">Holgura hasta {formatTime(row.fechaHoraFinHolgura)}</span>
                </div>
              ),
            },
            {
              key: 'cliente',
              label: 'Cliente',
              render: (row) => fullName(clientsById[row.idCliente]) || row.idCliente,
            },
            {
              key: 'staff',
              label: 'Staff',
              render: (row) => fullName(staffById[row.idStaff]) || row.idStaff,
            },
            {
              key: 'servicio',
              label: 'Servicio',
              render: (row) => servicesById[row.idServicio]?.nombre || row.idServicio,
            },
            {
              key: 'estadoCita',
              label: 'Estado',
              render: (row) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border bg-neutral-50 text-neutral-700 border-neutral-200">
                  {row.estadoCita}
                </span>
              ),
            },
            {
              key: 'duracionServicioMin',
              label: 'Duracion',
              render: (row) => (
                <div className="flex items-center gap-1.5 text-xs text-ink-soft font-bold">
                  <Clock size={14} className="text-primary" />
                  <span>{row.duracionServicioMin || 0} mins</span>
                </div>
              ),
            },
            {
              key: 'acciones',
              label: 'Acciones',
              render: (row) => {
                const bookingId = getBookingId(row);
                const selectedStatus = statusDrafts[bookingId] || row.estadoCita;
                return (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="min-h-[2.3rem] rounded-full border border-neutral-200 bg-white px-3 text-xs font-bold"
                      value={selectedStatus}
                      onChange={(event) => setStatusDrafts((current) => ({ ...current, [bookingId]: event.target.value }))}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatusMutation.mutate({ idCita: bookingId, estadoCita: selectedStatus })}
                      disabled={updateStatusMutation.isPending || selectedStatus === row.estadoCita}
                    >
                      <CheckCircle2 size={14} />
                      Guardar
                    </Button>
                    {row.estadoCita !== 'CANCELADA' && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => cancelMutation.mutate(bookingId)} disabled={cancelMutation.isPending}>
                        <XCircle size={14} />
                        Cancelar
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          rows={monthBookings}
        />
      )}
    </div>
  );
}

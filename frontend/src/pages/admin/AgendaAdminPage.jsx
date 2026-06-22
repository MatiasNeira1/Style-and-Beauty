import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from 'lucide-react';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminKpiCard,
  AdminKpiGrid,
  AdminPageHeader,
  AdminSkeleton,
  AdminStatusBadge,
} from '../../components/admin/AdminPrimitives.jsx';
import { AdminAutocomplete } from '../../components/admin/AdminAutocomplete.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { formatCurrencyCLP, formatDate, formatTime, fullName } from '../../utils/adminFormatters.js';
import { bookingDateRejectionMessage, filterBookableSlots, formatLocalDate } from '../../utils/bookingDateRules.js';

const statusOptions = ['PENDIENTE_PAGO', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA', 'EXPIRADA', 'RECHAZADA'];
const viewOptions = ['Dia', 'Semana', 'Mes', 'Lista'];

function monthValue() {
  return new Date().toISOString().slice(0, 7);
}

function todayValue() {
  return formatLocalDate(new Date());
}

function getBookingId(booking) {
  return booking.idCita || booking.id;
}

function sameLocalMonth(value, selectedMonth) {
  if (!value) return false;
  return new Date(value).toISOString().slice(0, 7) === selectedMonth;
}

function sameLocalDay(value, selectedDay) {
  if (!value || !selectedDay) return false;
  return new Date(value).toISOString().slice(0, 10) === selectedDay;
}

function normalizeError(error) {
  const status = error?.response?.status;
  if (status >= 500) return 'Ocurrio un problema al consultar las reservas. Intenta nuevamente.';
  if (status === 401 || status === 403) return 'No tienes permisos suficientes para consultar la agenda.';
  return 'No pudimos cargar la agenda en este momento.';
}

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id;
}

function getPersonId(person) {
  return person.idPersona || person.idCliente || person.idStaff || person.id;
}

function getSlotStart(slot) {
  return slot?.inicio || slot?.startsAt || slot?.horaInicio;
}

function getSlotEnd(slot) {
  return slot?.finAtencion || slot?.finVisible || slot?.endsAt || slot?.horaFin;
}

function formatSlotRange(slot) {
  return `${formatTime(getSlotStart(slot))} - ${formatTime(getSlotEnd(slot))}`;
}

function initialBookingForm() {
  return {
    idCliente: '',
    idServicio: '',
    idStaff: '',
    fecha: '',
    observacionCliente: '',
  };
}

function BookingCard({ booking, service, client, staffMember, statusDraft, onStatusDraftChange, onSaveStatus, onCancel, isMutating }) {
  const bookingId = getBookingId(booking);
  const amount = service?.precio_total || service?.precioTotal || booking.monto || 0;
  return (
    <article className="admin-booking-card">
      <div className="admin-booking-time">
        <strong>{formatTime(booking.fechaHoraInicio)}</strong>
        <span>{formatTime(booking.fechaHoraFin)}</span>
      </div>
      <div className="admin-booking-main">
        <header>
          <div>
            <h3>{fullName(client) || `Cliente #${booking.idCliente || 'sin dato'}`}</h3>
            <p>{service?.nombre || `Servicio #${booking.idServicio || 'sin dato'}`}</p>
          </div>
          <AdminStatusBadge status={booking.estadoCita} />
        </header>
        <div className="admin-booking-meta">
          <span><UserRound size={14} /> {fullName(staffMember) || `Profesional #${booking.idStaff || 'sin dato'}`}</span>
          <span><Clock size={14} /> {booking.duracionServicioMin || service?.duracion_minutos || 0} min</span>
          <span>{formatCurrencyCLP(amount)}</span>
        </div>
        <div className="admin-booking-actions">
          <select
            value={statusDraft || booking.estadoCita}
            onChange={(event) => onStatusDraftChange(bookingId, event.target.value)}
            aria-label="Cambiar estado de reserva"
          >
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onSaveStatus(bookingId, statusDraft || booking.estadoCita)}
            disabled={isMutating || (statusDraft || booking.estadoCita) === booking.estadoCita}
          >
            <CheckCircle2 size={14} />
            Guardar
          </Button>
          {booking.estadoCita !== 'CANCELADA' && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onCancel(bookingId)} disabled={isMutating}>
              <XCircle size={14} />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function AdminReservationModal({ open, onClose, clients, services, staff, onCreated }) {
  const [form, setForm] = useState(initialBookingForm);
  const [slots, setSlots] = useState([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState('');
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityBody, setAvailabilityBody] = useState(null);
  const [formError, setFormError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const serviceStaffQuery = useQuery({
    queryKey: ['agenda-admin-service-staff', form.idServicio],
    queryFn: () => agendaService.listarStaffPorServicio(form.idServicio),
    enabled: open && agendaService.isValidUuid(form.idServicio),
    retry: false,
    staleTime: 1000 * 60,
  });

  const serviceStaff = Array.isArray(serviceStaffQuery.data) ? serviceStaffQuery.data : [];
  const staffOptions = form.idServicio ? serviceStaff : staff;

  useEffect(() => {
    if (!open) return;
    setForm(initialBookingForm());
    setSlots([]);
    setSelectedSlotStart('');
    setAvailabilityChecked(false);
    setAvailabilityBody(null);
    setFormError('');
    setAvailabilityLoading(false);
    setSaving(false);
  }, [open]);

  const resetAvailability = () => {
    setSlots([]);
    setSelectedSlotStart('');
    setAvailabilityChecked(false);
    setAvailabilityBody(null);
  };

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    resetAvailability();
  };

  const validateBase = () => {
    if (!agendaService.isValidUuid(form.idCliente)) return 'Selecciona un cliente para crear la reserva.';
    if (!agendaService.isValidUuid(form.idServicio)) return 'Selecciona un servicio para consultar disponibilidad.';
    if (!agendaService.isValidUuid(form.idStaff)) return 'Selecciona un profesional para consultar disponibilidad.';
    if (!form.fecha) return 'Selecciona una fecha para consultar disponibilidad.';
    const dateMessage = bookingDateRejectionMessage(form.fecha);
    if (dateMessage) return dateMessage;
    return '';
  };

  const availabilityPayload = () => ({
    idServicio: form.idServicio,
    idStaff: form.idStaff,
    fecha: form.fecha,
  });

  const handleConsultAvailability = async () => {
    const validationMessage = validateBase();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = availabilityPayload();
    setAvailabilityLoading(true);
    setFormError('');
    setSelectedSlotStart('');
    try {
      const response = await agendaService.consultarDisponibilidad(payload);
      const bookableSlots = filterBookableSlots(response);
      setSlots(bookableSlots);
      setAvailabilityChecked(true);
      setAvailabilityBody(payload);
    } catch (error) {
      setSlots([]);
      setAvailabilityChecked(false);
      setAvailabilityBody(null);
      setFormError(error?.message || 'No pudimos consultar la disponibilidad. Intenta nuevamente.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const validationMessage = validateBase();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    if (!availabilityChecked) {
      setFormError('Consulta disponibilidad antes de guardar la reserva.');
      return;
    }
    if (!selectedSlotStart) {
      setFormError('Selecciona una hora disponible para guardar la reserva.');
      return;
    }

    const payload = availabilityPayload();
    setSaving(true);
    setFormError('');
    try {
      const freshSlots = filterBookableSlots(await agendaService.consultarDisponibilidad(payload));
      const selectedSlot = freshSlots.find((slot) => getSlotStart(slot) === selectedSlotStart);
      if (!selectedSlot) {
        setSlots(freshSlots);
        setSelectedSlotStart('');
        setAvailabilityChecked(true);
        setAvailabilityBody(payload);
        throw new Error('La hora seleccionada ya no está disponible. Consulta disponibilidad nuevamente.');
      }

      const booking = await agendaService.createAdminBooking({
        idCliente: form.idCliente,
        idServicio: form.idServicio,
        idStaff: form.idStaff,
        fechaHoraInicio: getSlotStart(selectedSlot),
        observacionCliente: form.observacionCliente?.trim() || 'Reserva creada desde panel administrativo',
      });

      onCreated({ booking, fecha: form.fecha, availabilityBody: payload });
    } catch (error) {
      setFormError(error?.message || 'No pudimos crear la reserva. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const closeDisabled = availabilityLoading || saving;

  return (
    <Modal open={open} title="Nueva reserva" onClose={onClose} closeDisabled={closeDisabled} className="admin-reservation-modal">
      <form className="admin-reservation-form" onSubmit={handleSave}>
        {formError && (
          <div className="admin-alert compact" role="alert">
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        <div className="admin-reservation-grid">
          <AdminAutocomplete
            id="new-booking-client"
            label="Cliente"
            options={clients}
            selectedValue={form.idCliente}
            placeholder="Buscar cliente"
            emptyMessage="No hay clientes disponibles"
            getOptionValue={getPersonId}
            getOptionLabel={(client) => fullName(client) || client.emailContacto || client.email || 'Cliente'}
            getOptionMeta={(client) => client.emailContacto || client.email || client.telefono || 'Sin contacto'}
            getOptionSearchText={(client) => [fullName(client), client.emailContacto, client.email, client.rut, client.telefono].filter(Boolean).join(' ')}
            onSelect={updateField('idCliente')}
            onClear={() => updateField('idCliente')('')}
          />

          <AdminAutocomplete
            id="new-booking-service"
            label="Servicio"
            options={services}
            selectedValue={form.idServicio}
            placeholder="Buscar servicio"
            emptyMessage="No hay servicios disponibles"
            getOptionValue={getServiceId}
            getOptionLabel={(service) => service.nombre || 'Servicio'}
            getOptionMeta={(service) => {
              const duration = service.duracion_minutos || service.duracionMinutos;
              return [service.categoria, duration ? `${duration} min` : null].filter(Boolean).join(' · ');
            }}
            getOptionSearchText={(service) => [service.nombre, service.categoria].filter(Boolean).join(' ')}
            onSelect={(value) => {
              setForm((current) => ({ ...current, idServicio: value, idStaff: '' }));
              setFormError('');
              resetAvailability();
            }}
            onClear={() => {
              setForm((current) => ({ ...current, idServicio: '', idStaff: '' }));
              resetAvailability();
            }}
          />

          <AdminAutocomplete
            id="new-booking-staff"
            label="Profesional"
            options={staffOptions}
            selectedValue={form.idStaff}
            placeholder={form.idServicio ? 'Buscar profesional' : 'Selecciona servicio primero'}
            emptyMessage={serviceStaffQuery.isPending ? 'Cargando profesionales...' : serviceStaffQuery.isError ? 'No pudimos cargar profesionales del servicio' : 'No hay profesionales asociados'}
            getOptionValue={getPersonId}
            getOptionLabel={(member) => fullName(member) || 'Profesional'}
            getOptionMeta={(member) => member.especialidad?.nombre || member.nombreEspecialidad || member.emailContacto || 'Sin especialidad'}
            getOptionSearchText={(member) => [fullName(member), member.emailContacto, member.especialidad?.nombre, member.nombreEspecialidad].filter(Boolean).join(' ')}
            onSelect={updateField('idStaff')}
            onClear={() => updateField('idStaff')('')}
          />

          <Input
            label="Fecha"
            id="new-booking-date"
            type="date"
            min={todayValue()}
            value={form.fecha}
            onChange={(event) => updateField('fecha')(event.target.value)}
          />
        </div>

        <Input
          label="Nota interna"
          id="new-booking-note"
          as="textarea"
          rows={3}
          value={form.observacionCliente}
          onChange={(event) => setForm((current) => ({ ...current, observacionCliente: event.target.value }))}
          placeholder="Opcional"
        />

        <section className="admin-reservation-availability">
          <div className="admin-reservation-availability-header">
            <div>
              <h3>Horarios disponibles</h3>
              <p>{availabilityBody ? `Body: ${JSON.stringify(availabilityBody)}` : 'Selecciona cliente, servicio, profesional y fecha.'}</p>
            </div>
            <button
              type="button"
              className="admin-secondary-action"
              onClick={handleConsultAvailability}
              disabled={availabilityLoading || saving}
            >
              {availabilityLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              Consultar horarios
            </button>
          </div>

          {availabilityLoading && <p className="admin-reservation-empty">Consultando disponibilidad real...</p>}
          {!availabilityLoading && availabilityChecked && slots.length === 0 && (
            <p className="admin-reservation-empty">No hay horarios disponibles para esta selección.</p>
          )}
          {!availabilityLoading && slots.length > 0 && (
            <div className="admin-slot-grid" role="listbox" aria-label="Horarios disponibles">
              {slots.map((slot) => {
                const start = getSlotStart(slot);
                return (
                  <button
                    key={start}
                    type="button"
                    className={selectedSlotStart === start ? 'active' : ''}
                    role="option"
                    aria-selected={selectedSlotStart === start}
                    onClick={() => {
                      setSelectedSlotStart(start);
                      setFormError('');
                    }}
                  >
                    <Clock size={14} />
                    {formatSlotRange(slot)}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="admin-reservation-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={closeDisabled}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || availabilityLoading}>
            {saving ? <Loader2 size={16} className="spin" /> : <CalendarPlus size={16} />}
            {saving ? 'Guardando...' : 'Guardar reserva'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AgendaAdminPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [staffFilter, setStaffFilter] = useState('TODOS');
  const [serviceFilter, setServiceFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('Lista');
  const [statusDrafts, setStatusDrafts] = useState({});
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastAvailabilityBody, setLastAvailabilityBody] = useState(null);

  const bookingsQuery = useQuery({ queryKey: ['agenda-admin'], queryFn: agendaService.listBookings });
  const servicesQuery = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });
  const clientsQuery = useQuery({ queryKey: ['profiles-clients'], queryFn: profileService.listClients });
  const staffQuery = useQuery({ queryKey: ['profiles-staff'], queryFn: profileService.listStaff });

  const services = useMemo(() => (Array.isArray(servicesQuery.data) ? servicesQuery.data : []), [servicesQuery.data]);
  const clients = useMemo(() => (Array.isArray(clientsQuery.data) ? clientsQuery.data : []), [clientsQuery.data]);
  const staff = useMemo(() => (Array.isArray(staffQuery.data) ? staffQuery.data : []), [staffQuery.data]);

  useEffect(() => {
    if (!location.state?.openNewReservation) return;
    setBookingModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const servicesById = useMemo(() => services.reduce((acc, service) => {
    acc[getServiceId(service)] = service;
    return acc;
  }, {}), [services]);

  const clientsById = useMemo(() => clients.reduce((acc, client) => {
    acc[getPersonId(client)] = client;
    return acc;
  }, {}), [clients]);

  const staffById = useMemo(() => staff.reduce((acc, member) => {
    acc[getPersonId(member)] = member;
    return acc;
  }, {}), [staff]);

  const monthBookings = useMemo(() => {
    const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
    const selectedMonth = selectedDate ? selectedDate.slice(0, 7) : monthValue();
    return bookings
      .filter((booking) => sameLocalMonth(booking.fechaHoraInicio, selectedMonth))
      .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
  }, [bookingsQuery.data, selectedDate]);

  const filteredBookings = useMemo(() => (
    monthBookings.filter((booking) => {
      const client = clientsById[booking.idCliente];
      const haystack = [
        getBookingId(booking),
        fullName(client),
        client?.emailContacto,
        client?.email,
        client?.correo,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesDate = selectedDate ? sameLocalDay(booking.fechaHoraInicio, selectedDate) : true;
      const matchesStatus = statusFilter === 'TODOS' ? true : booking.estadoCita === statusFilter;
      const matchesStaff = staffFilter === 'TODOS' ? true : String(booking.idStaff) === String(staffFilter);
      const matchesService = serviceFilter === 'TODOS' ? true : String(booking.idServicio) === String(serviceFilter);
      const matchesSearch = searchTerm.trim() ? haystack.includes(searchTerm.trim().toLowerCase()) : true;
      return matchesDate && matchesStatus && matchesStaff && matchesService && matchesSearch;
    })
  ), [clientsById, monthBookings, searchTerm, selectedDate, serviceFilter, staffFilter, statusFilter]);

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
  const isMutating = updateStatusMutation.isPending || cancelMutation.isPending;

  const confirmedCount = monthBookings.filter((booking) => booking.estadoCita === 'CONFIRMADA').length;
  const pendingCount = monthBookings.filter((booking) => booking.estadoCita === 'PENDIENTE_PAGO').length;
  const cancelledCount = monthBookings.filter((booking) => booking.estadoCita === 'CANCELADA').length;
  const finishedCount = monthBookings.filter((booking) => booking.estadoCita === 'FINALIZADA').length;
  const estimatedRevenue = monthBookings.reduce((sum, booking) => sum + Number(servicesById[booking.idServicio]?.precio_total || 0), 0);
  const todayBookings = monthBookings.filter((booking) => sameLocalDay(booking.fechaHoraInicio, selectedDate || todayValue()));
  const occupancy = monthBookings.length ? Math.round(((confirmedCount + finishedCount) / monthBookings.length) * 100) : 0;

  const hasActiveFilters = Boolean(selectedDate || searchTerm || statusFilter !== 'TODOS' || staffFilter !== 'TODOS' || serviceFilter !== 'TODOS');
  const activeChips = [
    selectedDate && { label: `Fecha ${formatDate(selectedDate, { day: '2-digit', month: 'short' })}`, onClear: () => setSelectedDate('') },
    statusFilter !== 'TODOS' && { label: statusFilter, onClear: () => setStatusFilter('TODOS') },
    staffFilter !== 'TODOS' && { label: fullName(staffById[staffFilter]) || 'Profesional', onClear: () => setStaffFilter('TODOS') },
    serviceFilter !== 'TODOS' && { label: servicesById[serviceFilter]?.nombre || 'Servicio', onClear: () => setServiceFilter('TODOS') },
    searchTerm && { label: `Busqueda: ${searchTerm}`, onClear: () => setSearchTerm('') },
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedDate('');
    setStatusFilter('TODOS');
    setStaffFilter('TODOS');
    setServiceFilter('TODOS');
    setSearchTerm('');
  };

  const refetchAgenda = () => {
    bookingsQuery.refetch();
    servicesQuery.refetch();
    clientsQuery.refetch();
    staffQuery.refetch();
  };

  const handleBookingCreated = ({ fecha, availabilityBody }) => {
    setBookingModalOpen(false);
    setSelectedDate(fecha || '');
    setStatusFilter('TODOS');
    setServiceFilter('TODOS');
    setStaffFilter('TODOS');
    setSearchTerm('');
    setLastAvailabilityBody(availabilityBody || null);
    setSuccessMsg('Reserva creada correctamente');
    queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
    window.setTimeout(() => setSuccessMsg(''), 5000);
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard admin-agenda-page">
        <AdminPageHeader title="Gestion de agenda" description="Cargando reservas, servicios y profesionales." />
        <AdminSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-agenda-page">
      <AdminPageHeader
        eyebrow="Operacion"
        title="Gestion de agenda"
        description="Controla reservas, estados, profesionales y disponibilidad operativa desde una vista clara."
        meta={(
          <div className="admin-segmented" aria-label="Vista de agenda">
            {viewOptions.map((view) => (
              <button key={view} type="button" className={viewMode === view ? 'active' : ''} aria-pressed={viewMode === view} onClick={() => setViewMode(view)}>
                {view}
              </button>
            ))}
          </div>
        )}
        actions={(
          <>
            <button type="button" className="admin-primary-action" onClick={() => setBookingModalOpen(true)}>
              <Plus size={16} />
              Nueva reserva
            </button>
            <button type="button" className="admin-secondary-action" onClick={() => setSelectedDate(todayValue())}>
              <CalendarDays size={16} />
              Ver hoy
            </button>
            <button type="button" className="admin-secondary-action" onClick={refetchAgenda}>
              <RefreshCw size={16} />
              Actualizar
            </button>
            <button type="button" className="admin-secondary-action">
              <Download size={16} />
              Exportar
            </button>
          </>
        )}
      />

      {successMsg && (
        <div className="admin-success-alert" role="status">
          {successMsg}
          {lastAvailabilityBody && <small>Disponibilidad consultada con body {JSON.stringify(lastAvailabilityBody)}</small>}
        </div>
      )}

      <AdminKpiGrid variant="three">
        <button type="button" className="admin-kpi-button" onClick={() => setStatusFilter('TODOS')}>
          <AdminKpiCard icon={CalendarRange} title="Citas del mes" value={monthBookings.length} trend={8} microcopy={`${filteredBookings.length} visibles con filtros`} tone="rose" />
        </button>
        <button type="button" className="admin-kpi-button" onClick={() => setStatusFilter('CONFIRMADA')}>
          <AdminKpiCard icon={CheckCircle2} title="Confirmadas" value={confirmedCount} trend={10} microcopy="Listas para atender" tone="sage" />
        </button>
        <button type="button" className="admin-kpi-button" onClick={() => setStatusFilter('PENDIENTE_PAGO')}>
          <AdminKpiCard icon={Clock} title="Pendientes" value={pendingCount} trend={pendingCount ? -5 : 0} microcopy="Requieren confirmacion" tone="gold" />
        </button>
        <button type="button" className="admin-kpi-button" onClick={() => setStatusFilter('CANCELADA')}>
          <AdminKpiCard icon={XCircle} title="Canceladas" value={cancelledCount} trend={cancelledCount ? -3 : 0} microcopy="Revisar motivos" tone="rose" />
        </button>
        <button type="button" className="admin-kpi-button" onClick={() => setStatusFilter('FINALIZADA')}>
          <AdminKpiCard icon={ListChecks} title="Finalizadas" value={finishedCount} trend={12} microcopy="Servicios completados" tone="ink" />
        </button>
        <AdminKpiCard icon={CalendarClock} title="Ocupacion" value={`${occupancy}%`} trend={occupancy >= 60 ? 7 : 0} microcopy={formatCurrencyCLP(estimatedRevenue)} tone="sage" />
      </AdminKpiGrid>

      <section className="admin-panel admin-agenda-filters">
        <header>
          <div>
            <h3>Filtros operativos</h3>
            <p>Combina fecha, estado, profesional, servicio y busqueda por cliente o ID de cita.</p>
          </div>
          {hasActiveFilters && <button type="button" className="admin-text-button" onClick={clearFilters}>Limpiar filtros</button>}
        </header>
        <div className="admin-agenda-filter-grid">
          <Input label="Fecha" id="agenda-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} hint="Vacío muestra el mes actual." />
          <Input as="select" label="Estado" id="agenda-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </Input>
          <AdminAutocomplete
            id="agenda-staff"
            label="Profesional"
            options={staff}
            selectedValue={staffFilter === 'TODOS' ? '' : staffFilter}
            placeholder="Buscar profesional"
            getOptionValue={getPersonId}
            getOptionLabel={(member) => fullName(member) || 'Profesional'}
            getOptionMeta={(member) => member.especialidad?.nombre || member.emailContacto || 'Sin especialidad'}
            getOptionSearchText={(member) => [fullName(member), member.emailContacto, member.especialidad?.nombre].filter(Boolean).join(' ')}
            onSelect={setStaffFilter}
            onClear={() => setStaffFilter('TODOS')}
          />
          <AdminAutocomplete
            id="agenda-service"
            label="Servicio"
            options={services}
            selectedValue={serviceFilter === 'TODOS' ? '' : serviceFilter}
            placeholder="Buscar servicio"
            getOptionValue={getServiceId}
            getOptionLabel={(service) => service.nombre || 'Servicio'}
            getOptionMeta={(service) => service.categoria || 'Sin categoria'}
            getOptionSearchText={(service) => [service.nombre, service.categoria].filter(Boolean).join(' ')}
            onSelect={setServiceFilter}
            onClear={() => setServiceFilter('TODOS')}
          />
          <label className="field admin-search-field">
            <span>Buscar</span>
            <div className="admin-filter-search">
              <Search size={16} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cliente, email o ID de cita" />
            </div>
          </label>
        </div>
        {activeChips.length > 0 && (
          <div className="admin-filter-chips">
            {activeChips.map((chip) => (
              <button key={chip.label} type="button" onClick={chip.onClear}>
                {chip.label}
                <XCircle size={13} />
              </button>
            ))}
          </div>
        )}
      </section>

      {isError ? (
        <AdminErrorState
          title="No pudimos cargar la agenda"
          message={normalizeError(error)}
          actions={(
            <>
              <button type="button" className="admin-primary-action" onClick={refetchAgenda}>Reintentar</button>
              {hasActiveFilters && <button type="button" className="admin-secondary-action" onClick={clearFilters}>Limpiar filtros</button>}
            </>
          )}
        />
      ) : (
        <div className="admin-agenda-workspace">
          <section className="admin-panel admin-booking-list-panel">
            <header>
              <div>
                <h3>{viewMode === 'Lista' ? 'Reservas filtradas' : `Vista ${viewMode.toLowerCase()}`}</h3>
                <p>{filteredBookings.length} reservas visibles de {monthBookings.length} del mes.</p>
              </div>
              <AdminStatusBadge status={statusFilter === 'TODOS' ? 'ACTIVO' : statusFilter}>{statusFilter === 'TODOS' ? 'Todos' : statusFilter}</AdminStatusBadge>
            </header>

            {filteredBookings.length ? (
              <div className="admin-booking-list">
                {filteredBookings.map((booking) => {
                  const bookingId = getBookingId(booking);
                  return (
                    <BookingCard
                      key={bookingId}
                      booking={booking}
                      service={servicesById[booking.idServicio]}
                      client={clientsById[booking.idCliente]}
                      staffMember={staffById[booking.idStaff]}
                      statusDraft={statusDrafts[bookingId]}
                      isMutating={isMutating}
                      onStatusDraftChange={(id, status) => setStatusDrafts((current) => ({ ...current, [id]: status }))}
                      onSaveStatus={(idCita, estadoCita) => updateStatusMutation.mutate({ idCita, estadoCita })}
                      onCancel={(idCita) => cancelMutation.mutate(idCita)}
                    />
                  );
                })}
              </div>
            ) : (
              <AdminEmptyState
                compact
                title="No hay reservas para este filtro"
                description="Prueba cambiando la fecha, el estado o creando una nueva reserva."
                action={(
                  <div className="admin-empty-actions">
                    {hasActiveFilters && <button type="button" className="admin-empty-action" onClick={clearFilters}>Limpiar filtros</button>}
                  </div>
                )}
              />
            )}
          </section>

          <aside className="admin-agenda-side">
            <section className="admin-panel">
              <header>
                <div>
                  <h3>Agenda del dia</h3>
                  <p>{selectedDate ? formatDate(selectedDate, { dateStyle: 'full' }) : 'Selecciona una fecha o revisa hoy.'}</p>
                </div>
              </header>
              <div className="admin-day-strip">
                {todayBookings.length ? todayBookings.slice(0, 5).map((booking) => (
                  <article key={getBookingId(booking)}>
                    <strong>{formatTime(booking.fechaHoraInicio)}</strong>
                    <span>{servicesById[booking.idServicio]?.nombre || 'Servicio'}</span>
                    <AdminStatusBadge status={booking.estadoCita} />
                  </article>
                )) : (
                  <AdminEmptyState compact title="Dia sin reservas" description="No hay actividad agendada para la fecha seleccionada." />
                )}
              </div>
            </section>

            <section className="admin-panel">
              <header>
                <div>
                  <h3>Estado del mes</h3>
                  <p>Resumen rapido de control operativo.</p>
                </div>
              </header>
              <div className="admin-agenda-status-stack">
                <span><b>{confirmedCount}</b> Confirmadas</span>
                <span><b>{pendingCount}</b> Pendientes</span>
                <span><b>{finishedCount}</b> Finalizadas</span>
                <span><b>{cancelledCount}</b> Canceladas</span>
              </div>
            </section>
          </aside>
        </div>
      )}

      <AdminReservationModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        clients={clients}
        services={services}
        staff={staff}
        onCreated={handleBookingCreated}
      />
    </div>
  );
}

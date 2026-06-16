import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Download,
  ListChecks,
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
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { formatCurrencyCLP, formatDate, formatTime, fullName } from '../../utils/adminFormatters.js';

const statusOptions = ['PENDIENTE_PAGO', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA', 'EXPIRADA', 'RECHAZADA'];
const viewOptions = ['Dia', 'Semana', 'Mes', 'Lista'];

function monthValue() {
  return new Date().toISOString().slice(0, 7);
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
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

export function AgendaAdminPage() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(monthValue());
  const [selectedDay, setSelectedDay] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [staffFilter, setStaffFilter] = useState('TODOS');
  const [serviceFilter, setServiceFilter] = useState('TODOS');
  const [staffSearch, setStaffSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('Lista');
  const [statusDrafts, setStatusDrafts] = useState({});

  const bookingsQuery = useQuery({ queryKey: ['agenda-admin'], queryFn: agendaService.listBookings });
  const servicesQuery = useQuery({ queryKey: ['services-admin'], queryFn: catalogService.listServices });
  const clientsQuery = useQuery({ queryKey: ['profiles-clients'], queryFn: profileService.listClients });
  const staffQuery = useQuery({ queryKey: ['profiles-staff'], queryFn: profileService.listStaff });

  const services = useMemo(() => (Array.isArray(servicesQuery.data) ? servicesQuery.data : []), [servicesQuery.data]);
  const clients = useMemo(() => (Array.isArray(clientsQuery.data) ? clientsQuery.data : []), [clientsQuery.data]);
  const staff = useMemo(() => (Array.isArray(staffQuery.data) ? staffQuery.data : []), [staffQuery.data]);

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

  const filteredStaffOptions = useMemo(() => {
    const needle = staffSearch.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter((member) => fullName(member)?.toLowerCase().includes(needle)
      || member.emailContacto?.toLowerCase().includes(needle)
      || member.especialidad?.nombre?.toLowerCase().includes(needle));
  }, [staff, staffSearch]);

  const filteredServiceOptions = useMemo(() => {
    const needle = serviceSearch.trim().toLowerCase();
    if (!needle) return services;
    return services.filter((service) => service.nombre?.toLowerCase().includes(needle)
      || service.categoria?.toLowerCase().includes(needle));
  }, [serviceSearch, services]);

  const monthBookings = useMemo(() => {
    const bookings = Array.isArray(bookingsQuery.data) ? bookingsQuery.data : [];
    return bookings
      .filter((booking) => sameLocalMonth(booking.fechaHoraInicio, selectedMonth))
      .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
  }, [bookingsQuery.data, selectedMonth]);

  const filteredBookings = useMemo(() => (
    monthBookings.filter((booking) => {
      const service = servicesById[booking.idServicio];
      const client = clientsById[booking.idCliente];
      const staffMember = staffById[booking.idStaff];
      const haystack = [
        getBookingId(booking),
        booking.estadoCita,
        service?.nombre,
        service?.categoria,
        fullName(client),
        fullName(staffMember),
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesDay = selectedDay ? sameLocalDay(booking.fechaHoraInicio, selectedDay) : true;
      const matchesStatus = statusFilter === 'TODOS' ? true : booking.estadoCita === statusFilter;
      const matchesStaff = staffFilter === 'TODOS' ? true : String(booking.idStaff) === String(staffFilter);
      const matchesService = serviceFilter === 'TODOS' ? true : String(booking.idServicio) === String(serviceFilter);
      const matchesSearch = searchTerm.trim() ? haystack.includes(searchTerm.trim().toLowerCase()) : true;
      return matchesDay && matchesStatus && matchesStaff && matchesService && matchesSearch;
    })
  ), [clientsById, monthBookings, searchTerm, selectedDay, serviceFilter, servicesById, staffById, staffFilter, statusFilter]);

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
  const todayBookings = monthBookings.filter((booking) => sameLocalDay(booking.fechaHoraInicio, selectedDay || todayValue()));
  const occupancy = monthBookings.length ? Math.round(((confirmedCount + finishedCount) / monthBookings.length) * 100) : 0;

  const hasActiveFilters = Boolean(selectedDay || searchTerm || statusFilter !== 'TODOS' || staffFilter !== 'TODOS' || serviceFilter !== 'TODOS');
  const activeChips = [
    selectedDay && { label: `Dia ${formatDate(selectedDay, { day: '2-digit', month: 'short' })}`, onClear: () => setSelectedDay('') },
    statusFilter !== 'TODOS' && { label: statusFilter, onClear: () => setStatusFilter('TODOS') },
    staffFilter !== 'TODOS' && { label: fullName(staffById[staffFilter]) || 'Profesional', onClear: () => setStaffFilter('TODOS') },
    serviceFilter !== 'TODOS' && { label: servicesById[serviceFilter]?.nombre || 'Servicio', onClear: () => setServiceFilter('TODOS') },
    searchTerm && { label: `Busqueda: ${searchTerm}`, onClear: () => setSearchTerm('') },
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedDay('');
    setStatusFilter('TODOS');
    setStaffFilter('TODOS');
    setServiceFilter('TODOS');
    setStaffSearch('');
    setServiceSearch('');
    setSearchTerm('');
  };

  const refetchAgenda = () => {
    bookingsQuery.refetch();
    servicesQuery.refetch();
    clientsQuery.refetch();
    staffQuery.refetch();
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
            <button type="button" className="admin-secondary-action" onClick={() => setSelectedDay(todayValue())}>
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
            <p>Combina fecha, estado, profesional, servicio y busqueda para encontrar una reserva rapidamente.</p>
          </div>
          {hasActiveFilters && <button type="button" className="admin-text-button" onClick={clearFilters}>Limpiar filtros</button>}
        </header>
        <div className="admin-agenda-filter-grid">
          <Input label="Mes" id="agenda-month" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value || monthValue())} />
          <Input label="Dia" id="agenda-day" type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
          <Input as="select" label="Estado" id="agenda-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </Input>
          <label className="field admin-filter-combo">
            <span>Profesional</span>
            <input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} placeholder="Filtrar profesional" />
            <select id="agenda-staff" value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}>
              <option value="TODOS">Todos los profesionales</option>
              {filteredStaffOptions.map((member) => (
                <option key={getPersonId(member)} value={getPersonId(member)}>{fullName(member) || 'Profesional'}</option>
              ))}
            </select>
          </label>
          <label className="field admin-filter-combo">
            <span>Servicio</span>
            <input value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Filtrar servicio" />
            <select id="agenda-service" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
              <option value="TODOS">Todos los servicios</option>
              {filteredServiceOptions.map((service) => (
                <option key={getServiceId(service)} value={getServiceId(service)}>{service.nombre || 'Servicio'}</option>
              ))}
            </select>
          </label>
          <label className="field admin-search-field">
            <span>Buscar</span>
            <div className="admin-filter-search">
              <Search size={16} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cliente, servicio o ID" />
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
                  <p>{selectedDay ? formatDate(selectedDay, { dateStyle: 'full' }) : 'Selecciona un dia o revisa hoy.'}</p>
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
    </div>
  );
}

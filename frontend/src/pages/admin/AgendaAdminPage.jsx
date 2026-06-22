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
  Trash2,
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
import { bookingDateRejectionMessage, filterBookableSlots, formatLocalDate, parseLocalDate } from '../../utils/bookingDateRules.js';

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

function getSlotAttentionEnd(slot) {
  return slot?.finAtencion || slot?.finVisible || slot?.endsAt || slot?.horaFin;
}

function getSlotBlockingEnd(slot) {
  return slot?.finVisible || slot?.finAtencion || slot?.endsAt || slot?.horaFin;
}

function formatSlotRange(slot) {
  return `${formatTime(getSlotStart(slot))} - ${formatTime(getSlotAttentionEnd(slot))}`;
}

function getServiceDuration(service) {
  return Number(service?.duracion_minutos || service?.duracionMinutos || service?.duracionServicioMin || 0);
}

function getServiceBuffer(service) {
  return Number(service?.holgura_minutos || service?.holguraMinutos || service?.holguraMin || 0);
}

function formatBookingDate(value) {
  const parsed = parseLocalDate(value);
  return parsed ? formatDate(parsed, { dateStyle: 'medium' }) : formatDate(value, { dateStyle: 'medium' });
}

function dateTimeMillis(value) {
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function sameDateTime(a, b) {
  const left = dateTimeMillis(a);
  const right = dateTimeMillis(b);
  return left !== null && right !== null && left === right;
}

function toTimePayload(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function createMultiServiceItem() {
  const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id: randomId,
    idServicio: '',
    idStaff: '',
    staffOptions: [],
    staffLoading: false,
    staffError: '',
    slots: [],
    selectedSlotStart: '',
    availabilityChecked: false,
    availabilityLoading: false,
  };
}

function initialMultiServiceItems() {
  return [createMultiServiceItem(), createMultiServiceItem()];
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
  const [bookingMode, setBookingMode] = useState('single');
  const [slots, setSlots] = useState([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState('');
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityBody, setAvailabilityBody] = useState(null);
  const [multiItems, setMultiItems] = useState(() => initialMultiServiceItems());
  const [multiSummary, setMultiSummary] = useState(null);
  const [formError, setFormError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const serviceStaffQuery = useQuery({
    queryKey: ['agenda-admin-service-staff', form.idServicio],
    queryFn: () => agendaService.listarStaffPorServicio(form.idServicio),
    enabled: open && bookingMode === 'single' && agendaService.isValidUuid(form.idServicio),
    retry: false,
    staleTime: 1000 * 60,
  });

  const serviceStaff = Array.isArray(serviceStaffQuery.data) ? serviceStaffQuery.data : [];
  const staffOptions = form.idServicio ? serviceStaff : staff;
  const anyItemLoading = multiItems.some((item) => item.staffLoading || item.availabilityLoading);

  useEffect(() => {
    if (!open) return;
    setForm(initialBookingForm());
    setBookingMode('single');
    setSlots([]);
    setSelectedSlotStart('');
    setAvailabilityChecked(false);
    setAvailabilityBody(null);
    setMultiItems(initialMultiServiceItems());
    setMultiSummary(null);
    setFormError('');
    setAvailabilityLoading(false);
    setChainLoading(false);
    setSaving(false);
  }, [open]);

  const resetAvailability = () => {
    setSlots([]);
    setSelectedSlotStart('');
    setAvailabilityChecked(false);
    setAvailabilityBody(null);
  };

  const resetItemAvailability = (item) => ({
    ...item,
    slots: [],
    selectedSlotStart: '',
    availabilityChecked: false,
    availabilityLoading: false,
  });

  const updateField = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    setMultiSummary(null);
    resetAvailability();
    if (field === 'fecha' || field === 'idCliente') {
      setMultiItems((current) => current.map(resetItemAvailability));
    }
  };

  const switchMode = (nextMode) => {
    setBookingMode(nextMode);
    setFormError('');
    setMultiSummary(null);
    resetAvailability();
  };

  const validateCommon = () => {
    if (!agendaService.isValidUuid(form.idCliente)) return 'Selecciona un cliente para crear la reserva.';
    if (!form.fecha) return 'Selecciona una fecha para consultar disponibilidad.';
    const dateMessage = bookingDateRejectionMessage(form.fecha);
    if (dateMessage) return dateMessage;
    return '';
  };

  const validateBase = () => {
    const commonMessage = validateCommon();
    if (commonMessage) return commonMessage;
    if (!agendaService.isValidUuid(form.idServicio)) return 'Selecciona un servicio para consultar disponibilidad.';
    if (!agendaService.isValidUuid(form.idStaff)) return 'Selecciona un profesional para consultar disponibilidad.';
    return '';
  };

  const availabilityPayload = () => ({
    idCliente: form.idCliente,
    idServicio: form.idServicio,
    idStaff: form.idStaff,
    fecha: form.fecha,
  });

  const normalizeBookingError = (error, fallback) => {
    const message = String(error?.message || '');
    const normalized = message.toLowerCase();
    if (normalized.includes('jornada')) return 'El horario seleccionado excede la jornada laboral del profesional.';
    if (normalized.includes('profesional ya tiene')) return 'El profesional ya tiene una reserva en ese horario.';
    if (normalized.includes('solape') || normalized.includes('no esta disponible') || normalized.includes('no está disponible')) {
      return 'El profesional ya tiene una reserva en ese horario.';
    }
    if (normalized.includes('encadenar') || normalized.includes('horario laboral')) {
      return 'No fue posible encadenar todos los servicios dentro del horario laboral del profesional.';
    }
    return message || fallback;
  };

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
      console.debug('Admin reservation availability payload', payload);
      const response = await agendaService.consultarDisponibilidad(payload);
      const bookableSlots = filterBookableSlots(response);
      setSlots(bookableSlots);
      setAvailabilityChecked(true);
      setAvailabilityBody(payload);
    } catch (error) {
      setSlots([]);
      setAvailabilityChecked(false);
      setAvailabilityBody(null);
      setFormError(normalizeBookingError(error, 'No pudimos consultar la disponibilidad. Intenta nuevamente.'));
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
      console.debug('Admin reservation availability payload', payload);
      const freshSlots = filterBookableSlots(await agendaService.consultarDisponibilidad(payload));
      const selectedSlot = freshSlots.find((slot) => sameDateTime(getSlotStart(slot), selectedSlotStart));
      if (!selectedSlot) {
        setSlots(freshSlots);
        setSelectedSlotStart('');
        setAvailabilityChecked(true);
        setAvailabilityBody(payload);
        throw new Error('La hora seleccionada ya no está disponible. Consulta disponibilidad nuevamente.');
      }

      const createBody = {
        idCliente: form.idCliente,
        idServicio: form.idServicio,
        idStaff: form.idStaff,
        fechaHoraInicio: getSlotStart(selectedSlot),
        observacionCliente: form.observacionCliente?.trim() || 'Reserva creada desde panel administrativo',
      };

      console.debug('Admin reservation create payload', createBody);
      const booking = await agendaService.createAdminBooking(createBody);
      const client = clientsById[form.idCliente];
      const staffMember = staffById[form.idStaff] || serviceStaff.find((member) => String(getPersonId(member)) === String(form.idStaff));

      onCreated({
        booking,
        mode: 'single',
        fecha: form.fecha,
        horaInicio: getSlotStart(selectedSlot),
        clientName: fullName(client) || 'el cliente seleccionado',
        staffName: fullName(staffMember) || 'el profesional seleccionado',
        availabilityBody: payload,
        createBody,
      });
    } catch (error) {
      setFormError(normalizeBookingError(error, 'No pudimos crear la reserva. Revisa los datos e intenta nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const validateItemAvailability = (item) => {
    if (!form.fecha) return 'Selecciona una fecha para consultar disponibilidad.';
    const dateMessage = bookingDateRejectionMessage(form.fecha);
    if (dateMessage) return dateMessage;
    if (!agendaService.isValidUuid(item.idServicio)) return 'Selecciona un servicio para consultar disponibilidad.';
    if (!agendaService.isValidUuid(item.idStaff)) return 'Selecciona un profesional para consultar disponibilidad.';
    return '';
  };

  const multiAvailabilityPayload = (item) => ({
    idServicio: item.idServicio,
    idStaff: item.idStaff,
    fecha: form.fecha,
  });

  const updateMultiItem = (itemId, updater) => {
    setMultiItems((current) => current.map((item) => (
      item.id === itemId ? updater(item) : item
    )));
  };

  const handleMultiServiceSelect = async (itemId, value) => {
    setFormError('');
    setMultiSummary(null);
    setMultiItems((current) => current.map((item) => (
      item.id === itemId
        ? {
            ...resetItemAvailability(item),
            idServicio: value,
            idStaff: '',
            staffOptions: [],
            staffLoading: agendaService.isValidUuid(value),
            staffError: '',
          }
        : item
    )));

    if (!agendaService.isValidUuid(value)) return;

    try {
      const options = await agendaService.listarStaffPorServicio(value);
      updateMultiItem(itemId, (item) => (
        item.idServicio === value
          ? { ...item, staffOptions: Array.isArray(options) ? options : [], staffLoading: false, staffError: '' }
          : item
      ));
    } catch {
      updateMultiItem(itemId, (item) => (
        item.idServicio === value
          ? { ...item, staffOptions: [], staffLoading: false, staffError: 'No pudimos cargar profesionales del servicio' }
          : item
      ));
    }
  };

  const handleMultiStaffSelect = (itemId, value) => {
    setFormError('');
    setMultiSummary(null);
    updateMultiItem(itemId, (item) => ({ ...resetItemAvailability(item), idStaff: value }));
  };

  const handleConsultItemAvailability = async (itemId) => {
    const item = multiItems.find((current) => current.id === itemId);
    if (!item) return;

    const validationMessage = validateItemAvailability(item);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = multiAvailabilityPayload(item);
    updateMultiItem(itemId, (current) => ({ ...current, availabilityLoading: true }));
    setFormError('');
    try {
      console.debug('Admin reservation availability payload', payload);
      const response = await agendaService.consultarDisponibilidad(payload);
      const bookableSlots = filterBookableSlots(response);
      updateMultiItem(itemId, (current) => ({
        ...current,
        slots: bookableSlots,
        selectedSlotStart: bookableSlots.some((slot) => sameDateTime(getSlotStart(slot), current.selectedSlotStart))
          ? current.selectedSlotStart
          : '',
        availabilityChecked: true,
        availabilityLoading: false,
      }));
      if (!bookableSlots.length) {
        setFormError('No hay horarios disponibles para el servicio seleccionado.');
      }
    } catch (error) {
      updateMultiItem(itemId, (current) => ({
        ...current,
        slots: [],
        selectedSlotStart: '',
        availabilityChecked: false,
        availabilityLoading: false,
      }));
      setFormError(normalizeBookingError(error, 'No pudimos consultar la disponibilidad. Intenta nuevamente.'));
    }
  };

  const addMultiItem = () => {
    setFormError('');
    setMultiSummary(null);
    setMultiItems((current) => [...current, createMultiServiceItem()]);
  };

  const removeMultiItem = (itemId) => {
    setFormError('');
    setMultiSummary(null);
    setMultiItems((current) => (current.length > 2 ? current.filter((item) => item.id !== itemId) : current));
  };

  const validateMultiple = () => {
    const commonMessage = validateCommon();
    if (commonMessage) return commonMessage;
    if (multiItems.length < 2) return 'Agrega al menos dos servicios para una reserva múltiple.';

    const selectedServices = new Set();
    for (let index = 0; index < multiItems.length; index += 1) {
      const item = multiItems[index];
      if (!agendaService.isValidUuid(item.idServicio)) return `Selecciona el servicio ${index + 1}.`;
      if (!agendaService.isValidUuid(item.idStaff)) return `Selecciona el profesional del servicio ${index + 1}.`;
      if (selectedServices.has(item.idServicio)) return 'La reserva múltiple requiere servicios distintos.';
      selectedServices.add(item.idServicio);
    }

    if (!multiItems[0]?.selectedSlotStart) {
      return 'Selecciona la primera hora disponible para iniciar la cadena.';
    }

    return '';
  };

  const handleBuildMultipleSummary = async (event) => {
    event.preventDefault();
    const validationMessage = validateMultiple();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setChainLoading(true);
    setFormError('');
    setMultiSummary(null);

    const refreshedSlots = new Map();
    const availabilityBodies = [];
    const planned = [];
    let previousBlockEndMs = null;

    try {
      for (let index = 0; index < multiItems.length; index += 1) {
        const item = multiItems[index];
        const payload = multiAvailabilityPayload(item);
        availabilityBodies.push(payload);
        console.debug('Admin reservation availability payload', payload);
        const response = await agendaService.consultarDisponibilidad(payload);
        const bookableSlots = filterBookableSlots(response)
          .slice()
          .sort((a, b) => dateTimeMillis(getSlotStart(a)) - dateTimeMillis(getSlotStart(b)));
        refreshedSlots.set(item.id, bookableSlots);

        if (!bookableSlots.length) {
          throw new Error(index === 0
            ? 'No hay horarios disponibles para el servicio seleccionado.'
            : 'No fue posible encadenar todos los servicios en esta fecha. Selecciona otra hora, staff o fecha.');
        }

        const slot = index === 0
          ? bookableSlots.find((candidate) => sameDateTime(getSlotStart(candidate), item.selectedSlotStart))
          : bookableSlots.find((candidate) => {
              const startMs = dateTimeMillis(getSlotStart(candidate));
              return startMs !== null && previousBlockEndMs !== null && startMs >= previousBlockEndMs;
            });

        if (!slot) {
          throw new Error(index === 0
            ? 'La primera hora seleccionada ya no está disponible. Consulta disponibilidad nuevamente.'
            : 'No fue posible encadenar todos los servicios en esta fecha. Selecciona otra hora, staff o fecha.');
        }

        const service = servicesById[item.idServicio];
        const staffMember = staffById[item.idStaff] || item.staffOptions.find((member) => String(getPersonId(member)) === String(item.idStaff));
        const startMs = dateTimeMillis(getSlotStart(slot));
        const blockEndMs = dateTimeMillis(getSlotBlockingEnd(slot));
        const attentionEndMs = dateTimeMillis(getSlotAttentionEnd(slot));
        const gapAfterPrevious = previousBlockEndMs === null || startMs === null
          ? null
          : Math.max(0, Math.round((startMs - previousBlockEndMs) / 60000));
        const duration = Number(slot.duracionServicioMin || getServiceDuration(service) || 0);
        const buffer = Number(slot.holguraMin || getServiceBuffer(service) || 0);

        planned.push({
          key: item.id,
          index,
          idServicio: item.idServicio,
          idStaff: item.idStaff,
          serviceName: service?.nombre || `Servicio ${index + 1}`,
          staffName: fullName(staffMember) || 'Profesional seleccionado',
          slot,
          startMs,
          attentionEndMs,
          blockEndMs,
          duration,
          buffer,
          warning: gapAfterPrevious !== null && gapAfterPrevious <= 15
            ? 'Bloque ajustado: comienza apenas termina la holgura anterior.'
            : '',
        });

        previousBlockEndMs = blockEndMs;
      }

      setMultiItems((current) => current.map((item, index) => {
        const itemSlots = refreshedSlots.get(item.id) || item.slots;
        const plannedItem = planned[index];
        return {
          ...item,
          slots: itemSlots,
          selectedSlotStart: index === 0 ? item.selectedSlotStart : getSlotStart(plannedItem.slot),
          availabilityChecked: true,
          availabilityLoading: false,
        };
      }));

      const totalDuration = planned.reduce((sum, item) => sum + item.duration, 0);
      const totalBuffer = planned.reduce((sum, item) => sum + item.buffer, 0);
      const totalBlockMinutes = planned.length
        ? Math.max(0, Math.round((planned[planned.length - 1].blockEndMs - planned[0].startMs) / 60000))
        : 0;

      setMultiSummary({
        clientName: fullName(clientsById[form.idCliente]) || 'Cliente seleccionado',
        fecha: form.fecha,
        items: planned,
        totalDuration,
        totalBuffer,
        totalBlockMinutes,
        availabilityBodies,
      });
    } catch (error) {
      setMultiItems((current) => current.map((item) => ({
        ...item,
        slots: refreshedSlots.get(item.id) || item.slots,
        availabilityChecked: refreshedSlots.has(item.id) || item.availabilityChecked,
        availabilityLoading: false,
      })));
      setFormError(normalizeBookingError(error, 'No fue posible encadenar todos los servicios en esta fecha. Selecciona otra hora, staff o fecha.'));
    } finally {
      setChainLoading(false);
    }
  };

  const handleConfirmMultiple = async () => {
    if (!multiSummary) {
      setFormError('Calcula y revisa el resumen antes de confirmar la agenda.');
      return;
    }

    const createBody = {
      idCliente: form.idCliente,
      fecha: form.fecha,
      reservas: multiSummary.items.map((item) => ({
        idServicio: item.idServicio,
        idStaff: item.idStaff,
        horaInicio: toTimePayload(getSlotStart(item.slot)),
        notaInterna: form.observacionCliente?.trim() || 'Reserva creada desde agenda múltiple del panel administrativo',
      })),
    };

    setSaving(true);
    setFormError('');
    try {
      console.debug('Admin reservation batch create payload', createBody);
      const booking = await agendaService.createAdminBookingBatch(createBody);
      onCreated({
        booking,
        mode: 'multiple',
        fecha: form.fecha,
        count: multiSummary.items.length,
        clientName: multiSummary.clientName,
        availabilityBodies: multiSummary.availabilityBodies,
        createBody,
      });
    } catch (error) {
      setFormError(normalizeBookingError(error, 'No pudimos crear la agenda múltiple. Revisa los datos e intenta nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const closeDisabled = availabilityLoading || saving || chainLoading || anyItemLoading;

  return (
    <Modal open={open} title="Nueva reserva" onClose={onClose} closeDisabled={closeDisabled} className="admin-reservation-modal">
      <form className="admin-reservation-form" onSubmit={bookingMode === 'single' ? handleSave : handleBuildMultipleSummary}>
        {formError && (
          <div className="admin-alert compact" role="alert">
            <AlertCircle size={16} />
            {formError}
          </div>
        )}

        <div className="admin-reservation-mode-toggle" aria-label="Tipo de reserva">
          <button type="button" className={bookingMode === 'single' ? 'active' : ''} onClick={() => switchMode('single')}>
            Reserva única
          </button>
          <button type="button" className={bookingMode === 'multiple' ? 'active' : ''} onClick={() => switchMode('multiple')}>
            Reserva múltiple
          </button>
        </div>

        {bookingMode === 'single' ? (
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
                const duration = getServiceDuration(service);
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
        ) : (
          <div className="admin-reservation-grid admin-reservation-common-grid">
            <AdminAutocomplete
              id="multi-booking-client"
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
            <Input
              label="Fecha"
              id="multi-booking-date"
              type="date"
              min={todayValue()}
              value={form.fecha}
              onChange={(event) => updateField('fecha')(event.target.value)}
            />
          </div>
        )}

        <Input
          label="Nota interna"
          id="new-booking-note"
          as="textarea"
          rows={3}
          value={form.observacionCliente}
          onChange={(event) => setForm((current) => ({ ...current, observacionCliente: event.target.value }))}
          placeholder="Opcional"
        />

        {bookingMode === 'single' ? (
          <section className="admin-reservation-availability">
            <div className="admin-reservation-availability-header">
              <div>
                <h3>Horarios disponibles</h3>
                <p>{availabilityBody ? 'Disponibilidad consultada correctamente.' : 'Selecciona cliente, servicio, profesional y fecha.'}</p>
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
              <p className="admin-reservation-empty">No hay horarios disponibles para el servicio seleccionado.</p>
            )}
            {!availabilityLoading && slots.length > 0 && (
              <div className="admin-slot-grid" role="listbox" aria-label="Horarios disponibles">
                {slots.map((slot) => {
                  const start = getSlotStart(slot);
                  return (
                    <button
                      key={start}
                      type="button"
                      className={sameDateTime(selectedSlotStart, start) ? 'active' : ''}
                      role="option"
                      aria-selected={sameDateTime(selectedSlotStart, start)}
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
        ) : (
          <section className="admin-multi-reservation">
            <header className="admin-multi-reservation-header">
              <div>
                <h3>Cadena de servicios</h3>
                <p>La primera hora seleccionada inicia la agenda; los siguientes servicios se asignan al bloque disponible más cercano posterior.</p>
              </div>
              <button type="button" className="admin-secondary-action" onClick={addMultiItem} disabled={closeDisabled}>
                <Plus size={16} />
                Agregar otro servicio
              </button>
            </header>

            <div className="admin-multi-service-list">
              {multiItems.map((item, index) => {
                const service = servicesById[item.idServicio];
                const itemStaffOptions = item.idServicio ? item.staffOptions : staff;
                const duration = getServiceDuration(service);
                const buffer = getServiceBuffer(service);
                return (
                  <article key={item.id} className="admin-multi-service-card">
                    <header>
                      <div>
                        <strong>Servicio {index + 1}</strong>
                        <small>{index === 0 ? 'Selecciona la primera hora.' : 'Se calcula automáticamente.'}</small>
                      </div>
                      <button
                        type="button"
                        className="admin-icon-danger"
                        onClick={() => removeMultiItem(item.id)}
                        disabled={multiItems.length <= 2 || closeDisabled}
                        aria-label={`Eliminar servicio ${index + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>

                    <div className="admin-reservation-grid">
                      <AdminAutocomplete
                        id={`multi-service-${item.id}`}
                        label="Servicio"
                        options={services}
                        selectedValue={item.idServicio}
                        placeholder="Buscar servicio"
                        emptyMessage="No hay servicios disponibles"
                        getOptionValue={getServiceId}
                        getOptionLabel={(option) => option.nombre || 'Servicio'}
                        getOptionMeta={(option) => {
                          const optionDuration = getServiceDuration(option);
                          return [option.categoria, optionDuration ? `${optionDuration} min` : null].filter(Boolean).join(' · ');
                        }}
                        getOptionSearchText={(option) => [option.nombre, option.categoria].filter(Boolean).join(' ')}
                        onSelect={(value) => handleMultiServiceSelect(item.id, value)}
                        onClear={() => handleMultiServiceSelect(item.id, '')}
                      />

                      <AdminAutocomplete
                        id={`multi-staff-${item.id}`}
                        label="Profesional"
                        options={itemStaffOptions}
                        selectedValue={item.idStaff}
                        placeholder={item.idServicio ? 'Buscar profesional' : 'Selecciona servicio primero'}
                        emptyMessage={item.staffLoading ? 'Cargando profesionales...' : item.staffError || 'No hay profesionales asociados'}
                        getOptionValue={getPersonId}
                        getOptionLabel={(member) => fullName(member) || 'Profesional'}
                        getOptionMeta={(member) => member.especialidad?.nombre || member.nombreEspecialidad || member.emailContacto || 'Sin especialidad'}
                        getOptionSearchText={(member) => [fullName(member), member.emailContacto, member.especialidad?.nombre, member.nombreEspecialidad].filter(Boolean).join(' ')}
                        onSelect={(value) => handleMultiStaffSelect(item.id, value)}
                        onClear={() => handleMultiStaffSelect(item.id, '')}
                      />
                    </div>

                    <div className="admin-multi-service-meta">
                      <span>{duration ? `${duration} min` : 'Duración por backend'}</span>
                      <span>{buffer ? `Holgura ${buffer} min` : 'Holgura validada por backend'}</span>
                      {item.availabilityChecked && <span>{item.slots.length} horarios base</span>}
                    </div>

                    <div className="admin-multi-service-actions">
                      <button
                        type="button"
                        className="admin-secondary-action"
                        onClick={() => handleConsultItemAvailability(item.id)}
                        disabled={item.availabilityLoading || chainLoading || saving}
                      >
                        {item.availabilityLoading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                        Consultar disponibilidad
                      </button>
                    </div>

                    {index === 0 && item.slots.length > 0 && (
                      <div className="admin-slot-grid" role="listbox" aria-label="Primera hora disponible">
                        {item.slots.map((slot) => {
                          const start = getSlotStart(slot);
                          return (
                            <button
                              key={start}
                              type="button"
                              className={sameDateTime(item.selectedSlotStart, start) ? 'active' : ''}
                              role="option"
                              aria-selected={sameDateTime(item.selectedSlotStart, start)}
                              onClick={() => {
                                setFormError('');
                                setMultiSummary(null);
                                updateMultiItem(item.id, (current) => ({ ...current, selectedSlotStart: start }));
                              }}
                            >
                              <Clock size={14} />
                              {formatSlotRange(slot)}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {index > 0 && item.availabilityChecked && (
                      <p className="admin-reservation-empty">
                        {item.slots.length
                          ? 'Disponibilidad base consultada. La hora exacta se asigna en el resumen.'
                          : 'No hay horarios disponibles para el servicio seleccionado.'}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {multiSummary && (
              <section className="admin-multi-summary">
                <header>
                  <div>
                    <h3>Resumen de agenda para {multiSummary.clientName}</h3>
                    <p>{formatBookingDate(multiSummary.fecha)}</p>
                  </div>
                  <span>{multiSummary.items.length} servicios · {multiSummary.totalBlockMinutes} min estimados</span>
                </header>

                <div className="admin-multi-summary-list">
                  {multiSummary.items.map((item, index) => (
                    <article key={item.key}>
                      <strong>{index + 1}. {item.serviceName}</strong>
                      <span>Profesional: {item.staffName}</span>
                      <span>{formatTime(getSlotStart(item.slot))} - {formatTime(getSlotAttentionEnd(item.slot))}</span>
                      <small>
                        Duración {item.duration || 'validada'} min · Holgura {item.buffer || 0} min
                      </small>
                      {item.warning && <em>{item.warning}</em>}
                    </article>
                  ))}
                </div>

                <footer>
                  <span>Total de servicios: {multiSummary.items.length}</span>
                  <span>Tiempo de atención: {multiSummary.totalDuration} min</span>
                  <span>Holgura total: {multiSummary.totalBuffer} min</span>
                </footer>
              </section>
            )}
          </section>
        )}

        {bookingMode === 'single' ? (
          <div className="admin-reservation-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={closeDisabled}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || availabilityLoading}>
              {saving ? <Loader2 size={16} className="spin" /> : <CalendarPlus size={16} />}
              {saving ? 'Guardando...' : 'Guardar reserva'}
            </Button>
          </div>
        ) : multiSummary ? (
          <div className="admin-reservation-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={closeDisabled}>
              Cancelar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMultiSummary(null)} disabled={closeDisabled}>
              Volver a editar
            </Button>
            <Button type="button" onClick={handleConfirmMultiple} disabled={saving || chainLoading || anyItemLoading}>
              {saving ? <Loader2 size={16} className="spin" /> : <CalendarPlus size={16} />}
              {saving ? 'Creando agenda...' : 'Confirmar agenda'}
            </Button>
          </div>
        ) : (
          <div className="admin-reservation-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={closeDisabled}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || chainLoading || anyItemLoading}>
              {chainLoading ? <Loader2 size={16} className="spin" /> : <ListChecks size={16} />}
              {chainLoading ? 'Calculando...' : 'Ver resumen'}
            </Button>
          </div>
        )}
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

  const handleBookingCreated = ({ fecha, mode, count, clientName, staffName, horaInicio }) => {
    setBookingModalOpen(false);
    setSelectedDate(fecha || '');
    setStatusFilter('TODOS');
    setServiceFilter('TODOS');
    setStaffFilter('TODOS');
    setSearchTerm('');
    setSuccessMsg(mode === 'multiple'
      ? `Agenda creada correctamente: ${count || 0} servicios reservados para ${clientName || 'el cliente seleccionado'}.`
      : `Reserva creada correctamente para ${clientName || 'el cliente seleccionado'} el ${formatBookingDate(fecha)} a las ${formatTime(horaInicio)} con ${staffName || 'el profesional seleccionado'}.`);
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

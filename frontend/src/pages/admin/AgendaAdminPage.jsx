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
import { AdminDatePicker } from '../../components/admin/agenda/AdminDatePicker.jsx';
import { ReservationDateLabel } from '../../components/admin/agenda/ReservationDateLabel.jsx';
import { ReservationTimeBlock } from '../../components/admin/agenda/ReservationTimeBlock.jsx';
import { ServiceCategoryPickerModal } from '../../components/admin/agenda/ServiceCategoryPickerModal.jsx';
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
  return slot?.finAtencion || slot?.horaFinAtencion || slot?.finVisible || slot?.endsAt || slot?.horaFin;
}

function formatSlotRange(slot) {
  return `${formatTime(getSlotStart(slot))} - ${formatTime(getSlotAttentionEnd(slot))}`;
}

function getServiceDuration(service) {
  return Number(service?.duracion_minutos || service?.duracionMinutos || service?.duracionServicioMin || 0);
}

function getServiceDurationMin(service) {
  return Number(service?.duracion_minutos_min || service?.duracionMinutosMin || getServiceDuration(service) || 0);
}

function getServiceDurationMax(service) {
  return Number(service?.duracion_minutos_max || service?.duracionMinutosMax || getServiceDuration(service) || 0);
}

function hasServiceDurationRange(service) {
  const min = getServiceDurationMin(service);
  const max = getServiceDurationMax(service);
  return min > 0 && max > min;
}

function defaultServiceDuration(service) {
  return getServiceDurationMax(service) || getServiceDuration(service) || '';
}

function getServicePrice(service) {
  const value = service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.valor ?? service?.monto ?? service?.price;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function getServiceAttentionType(service) {
  return service?.tipoAtencion || service?.tipo_atencion || service?.modalidad || service?.categoria || '';
}

function formatMinutesDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return '0 min';
  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`);
  return parts.join(' ') || '0 min';
}

function formatServiceDuration(service) {
  const min = getServiceDurationMin(service);
  const max = getServiceDurationMax(service);
  if (min > 0 && max > min) return `${formatMinutesDuration(min)} - ${formatMinutesDuration(max)}`;
  const duration = getServiceDuration(service);
  return duration ? formatMinutesDuration(duration) : '';
}

function parseDeposit(value) {
  if (value === '' || value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function validateDeposit(value, totalAmount = 0) {
  const amount = parseDeposit(value);
  if (amount === null) return 'Ingresa el abono realizado para continuar.';
  if (amount < 0) return 'Ingresa el abono realizado para continuar.';
  if (Number(totalAmount) > 0 && amount > Number(totalAmount)) return 'El abono no puede ser mayor al total de la reserva.';
  return '';
}

function validateDurationSelection(service, value) {
  if (!service || !hasServiceDurationRange(service)) return '';
  const duration = Number(value);
  const min = getServiceDurationMin(service);
  const max = getServiceDurationMax(service);
  if (!Number.isFinite(duration)) return 'Selecciona la duración final del servicio.';
  if (duration < min || duration > max) return `La duración debe estar entre ${formatMinutesDuration(min)} y ${formatMinutesDuration(max)}.`;
  return '';
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
    duracionServicioMin: '',
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
    duracionServicioMin: '',
    observacionCliente: '',
    abono: '',
  };
}

function BookingCard({ booking, service, client, staffMember, statusDraft, onStatusDraftChange, onSaveStatus, onCancel, isMutating }) {
  const bookingId = getBookingId(booking);
  const amount = service?.precio_total || service?.precioTotal || booking.monto || 0;
  const durationMinutes = booking.duracionServicioMin || getServiceDuration(service);
  return (
    <article className="admin-booking-card">
      <ReservationTimeBlock start={booking.fechaHoraInicio} end={booking.fechaHoraFin} durationMinutes={durationMinutes} />
      <div className="admin-booking-main">
        <header>
          <div>
            <ReservationDateLabel value={booking.fechaHoraInicio} />
            <h3>{fullName(client) || `Cliente #${booking.idCliente || 'sin dato'}`}</h3>
            <p>{service?.nombre || `Servicio #${booking.idServicio || 'sin dato'}`}</p>
          </div>
          <AdminStatusBadge status={booking.estadoCita} />
        </header>
        <div className="admin-booking-meta">
          <span><UserRound size={14} /> {fullName(staffMember) || `Profesional #${booking.idStaff || 'sin dato'}`}</span>
          <span><Clock size={14} /> {durationMinutes || 0} min</span>
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
  const [servicePickerTarget, setServicePickerTarget] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState('');
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityBody, setAvailabilityBody] = useState(null);
  const [multiItems, setMultiItems] = useState(() => initialMultiServiceItems());
  const [multiSummary, setMultiSummary] = useState(null);
  const [formError, setFormError] = useState('');
  const [summaryError, setSummaryError] = useState('');
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
  const staffOptions = form.idServicio ? serviceStaff : [];
  const anyItemLoading = multiItems.some((item) => item.staffLoading || item.availabilityLoading);

  useEffect(() => {
    if (!open) return;
    setForm(initialBookingForm());
    setBookingMode('single');
    setServicePickerTarget(null);
    setSlots([]);
    setSelectedSlotStart('');
    setAvailabilityChecked(false);
    setAvailabilityBody(null);
    setMultiItems(initialMultiServiceItems());
    setMultiSummary(null);
    setFormError('');
    setSummaryError('');
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
    setSummaryError('');
    setMultiSummary(null);
    resetAvailability();
    if (field === 'fecha' || field === 'idCliente') {
      setMultiItems((current) => current.map(resetItemAvailability));
    }
  };

  const switchMode = (nextMode) => {
    setBookingMode(nextMode);
    setServicePickerTarget(null);
    setFormError('');
    setSummaryError('');
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
    const durationMessage = validateDurationSelection(servicesById[form.idServicio], form.duracionServicioMin);
    if (durationMessage) return durationMessage;
    const depositMessage = validateDeposit(form.abono, getServicePrice(servicesById[form.idServicio]));
    if (depositMessage) return depositMessage;
    return '';
  };

  const availabilityPayload = () => ({
    idCliente: form.idCliente,
    idServicio: form.idServicio,
    idStaff: form.idStaff,
    fecha: form.fecha,
    duracionServicioMin: form.duracionServicioMin || undefined,
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
        duracionServicioMin: form.duracionServicioMin || undefined,
        observacionCliente: form.observacionCliente?.trim() || 'Reserva creada desde panel administrativo',
        abono: parseDeposit(form.abono),
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
        abono: parseDeposit(form.abono),
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
    idCliente: form.idCliente,
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
    setSummaryError('');
    setMultiSummary(null);
    const selectedService = servicesById[value];
    setMultiItems((current) => {
      const changedIndex = current.findIndex((item) => item.id === itemId);
      if (changedIndex < 0) return current;
      return current.map((item, index) => {
        if (index < changedIndex) return item;
        if (item.id === itemId) {
          return {
            ...resetItemAvailability(item),
            idServicio: value,
            idStaff: '',
            duracionServicioMin: selectedService ? defaultServiceDuration(selectedService) : '',
            staffOptions: [],
            staffLoading: agendaService.isValidUuid(value),
            staffError: '',
          };
        }
        return resetItemAvailability(item);
      });
    });

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
    setSummaryError('');
    setMultiSummary(null);
    setMultiItems((current) => {
      const changedIndex = current.findIndex((item) => item.id === itemId);
      if (changedIndex < 0) return current;
      return current.map((item, index) => {
        if (index < changedIndex) return item;
        if (item.id === itemId) return { ...resetItemAvailability(item), idStaff: value };
        return resetItemAvailability(item);
      });
    });
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
    setSummaryError('');
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
    let totalAmount = 0;
    for (let index = 0; index < multiItems.length; index += 1) {
      const item = multiItems[index];
      if (!agendaService.isValidUuid(item.idServicio)) return `Selecciona el servicio ${index + 1}.`;
      if (item.idStaff && !agendaService.isValidUuid(item.idStaff)) return `Selecciona un profesional valido para el servicio ${index + 1}.`;
      const durationMessage = validateDurationSelection(servicesById[item.idServicio], item.duracionServicioMin);
      if (durationMessage) return durationMessage;
      if (selectedServices.has(item.idServicio)) return 'La reserva múltiple requiere servicios distintos.';
      selectedServices.add(item.idServicio);
      totalAmount += getServicePrice(servicesById[item.idServicio]);
    }

    const depositMessage = validateDeposit(form.abono, totalAmount);
    if (depositMessage) return depositMessage;

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
    setSummaryError('');
    setMultiSummary(null);

    try {
      const firstStart = multiItems[0]?.selectedSlotStart ? toTimePayload(multiItems[0].selectedSlotStart) : undefined;
      const payload = {
        idCliente: form.idCliente,
        fecha: form.fecha,
        horaInicial: firstStart,
        maxPlanes: 1,
        servicios: multiItems.map((item) => ({
          idServicio: item.idServicio,
          idStaff: item.idStaff || undefined,
          duracionServicioMin: item.duracionServicioMin || undefined,
        })),
      };
      console.debug('Admin dynamic reservation plan payload', payload);
      const response = await agendaService.planificarDisponibilidadMultiple(payload);
      const plan = response?.planes?.[0];
      if (!plan) {
        throw new Error(response?.advertencias?.[0] || 'No fue posible encadenar todos los servicios en esta fecha. Selecciona otra hora, staff o fecha.');
      }

      const planned = plan.servicios.map((servicePlan, index) => {
        const item = multiItems[index];
        const service = servicesById[servicePlan.idServicio] || servicesById[item.idServicio];
        const staffMember = staffById[servicePlan.idStaff] || item.staffOptions.find((member) => String(getPersonId(member)) === String(servicePlan.idStaff));
        const slot = {
          horaInicio: servicePlan.horaInicio,
          horaFinAtencion: servicePlan.horaFinAtencion,
          bloqueadoHasta: servicePlan.bloqueadoHasta,
          duracionServicioMin: servicePlan.duracionServicioMin,
          holguraMin: servicePlan.holguraMin,
        };
        const wait = Number(servicePlan.esperaDesdeAnteriorMin || 0);
        return {
          key: item.id,
          index,
          idServicio: servicePlan.idServicio,
          idStaff: servicePlan.idStaff,
          serviceName: servicePlan.servicioNombre || service?.nombre || `Servicio ${index + 1}`,
          staffName: servicePlan.profesionalNombre || fullName(staffMember) || 'Profesional asignado',
          attentionType: getServiceAttentionType(service),
          price: getServicePrice(service),
          slot,
          startMs: dateTimeMillis(servicePlan.horaInicio),
          attentionEndMs: dateTimeMillis(servicePlan.horaFinAtencion),
          blockEndMs: dateTimeMillis(servicePlan.bloqueadoHasta),
          duration: Number(servicePlan.duracionServicioMin || 0),
          buffer: Number(servicePlan.holguraMin || 0),
          warning: wait > 0 ? `Espera real: ${formatMinutesDuration(wait)}` : '',
        };
      });

      setMultiItems((current) => current.map((item, index) => {
        const plannedItem = planned[index];
        return {
          ...item,
          idStaff: plannedItem.idStaff,
          duracionServicioMin: plannedItem.duration,
          selectedSlotStart: getSlotStart(plannedItem.slot),
          availabilityChecked: true,
          availabilityLoading: false,
        };
      }));

      const totalDuration = Number(plan.atencionTotalMin || planned.reduce((sum, item) => sum + item.duration, 0));
      const externalBuffer = Number(plan.holguraExternaMin || 0);
      const totalAmount = planned.reduce((sum, item) => sum + item.price, 0);
      const abonoAmount = parseDeposit(form.abono) || 0;
      const saldoAmount = Math.max(totalAmount - abonoAmount, 0);
      const totalBlockMinutes = Number(plan.tiempoBloqueadoTotalMin || 0);

      setMultiSummary({
        clientName: fullName(clientsById[form.idCliente]) || 'Cliente seleccionado',
        fecha: form.fecha,
        items: planned,
        totalDuration,
        totalBuffer: externalBuffer,
        totalBlockMinutes,
        totalAmount,
        hasPricing: totalAmount > 0,
        abonoAmount,
        saldoAmount,
        startsAt: plan.horaInicio,
        attentionEndsAt: plan.horaFinAtencion,
        blockedUntil: plan.bloqueadoHasta,
        availabilityBodies: [payload],
      });
    } catch (error) {
      setMultiItems((current) => current.map((item) => ({
        ...item,
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
      abono: multiSummary.abonoAmount,
      reservas: multiSummary.items.map((item) => ({
        idServicio: item.idServicio,
        idStaff: item.idStaff,
        horaInicio: toTimePayload(getSlotStart(item.slot)),
        duracionServicioMin: item.duration,
        notaInterna: form.observacionCliente?.trim() || 'Reserva creada desde agenda múltiple del panel administrativo',
      })),
    };

    setSaving(true);
    setFormError('');
    setSummaryError('');
    try {
      console.debug('Admin reservation batch create payload', createBody);
      const booking = await agendaService.createAdminBookingBatch(createBody);
      setMultiSummary(null);
      onCreated({
        booking,
        mode: 'multiple',
        fecha: form.fecha,
        count: multiSummary.items.length,
        clientName: multiSummary.clientName,
        abono: multiSummary.abonoAmount,
        availabilityBodies: multiSummary.availabilityBodies,
        createBody,
      });
    } catch (error) {
      setSummaryError(normalizeBookingError(error, 'No pudimos crear la agenda múltiple. Revisa los datos e intenta nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSingleServiceSelect = (value) => {
    const selectedService = servicesById[value];
    setForm((current) => ({
      ...current,
      idServicio: value,
      idStaff: '',
      duracionServicioMin: selectedService ? defaultServiceDuration(selectedService) : '',
    }));
    setFormError('');
    setSummaryError('');
    setMultiSummary(null);
    resetAvailability();
  };

  const handleServicePickerSelect = (value) => {
    if (servicePickerTarget?.type === 'multi') {
      handleMultiServiceSelect(servicePickerTarget.itemId, value);
      return;
    }

    handleSingleServiceSelect(value);
  };

  const clearSingleService = () => {
    handleSingleServiceSelect('');
  };

  const servicePickerIndex = servicePickerTarget?.type === 'multi'
    ? multiItems.findIndex((item) => item.id === servicePickerTarget.itemId)
    : -1;
  const servicePickerSelectedValue = servicePickerTarget?.type === 'multi'
    ? multiItems.find((item) => item.id === servicePickerTarget.itemId)?.idServicio || ''
    : form.idServicio;
  const servicePickerTitle = servicePickerTarget?.type === 'multi'
    ? `Seleccionar servicio ${servicePickerIndex + 1}`
    : 'Seleccionar servicio';
  const selectedSingleService = servicesById[form.idServicio];

  const renderServicePickerButton = ({ id, selectedId, onOpen, onClear }) => {
    const selectedService = servicesById[selectedId];
    const durationLabel = formatServiceDuration(selectedService);
    const price = getServicePrice(selectedService);
    const meta = selectedService
      ? [selectedService.categoria, durationLabel || null, price > 0 ? formatCurrencyCLP(price) : null].filter(Boolean).join(' · ')
      : 'Primero elige categoria y luego servicio';

    return (
      <div className="field admin-service-picker-field">
        <span>Servicio</span>
        <div className="admin-service-picker-control">
          <button
            id={id}
            type="button"
            className={`admin-service-picker-trigger ${selectedService ? 'has-value' : ''}`}
            onClick={onOpen}
            aria-haspopup="dialog"
          >
            <span className="admin-service-picker-copy">
              <strong>{selectedService?.nombre || 'Seleccionar servicio'}</strong>
              <small>{meta}</small>
            </span>
            <Search size={16} />
          </button>
          {selectedService && (
            <button
              type="button"
              className="admin-service-picker-clear"
              onClick={onClear}
              aria-label="Limpiar servicio"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const closeDisabled = availabilityLoading || saving || chainLoading || anyItemLoading;

  return (
    <>
      <Modal open={open} title="Nueva reserva" onClose={onClose} closeDisabled={closeDisabled || Boolean(multiSummary)} className="admin-reservation-modal">
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

            {renderServicePickerButton({
              id: 'new-booking-service',
              selectedId: form.idServicio,
              onOpen: () => setServicePickerTarget({ type: 'single' }),
              onClear: clearSingleService,
            })}

            {hasServiceDurationRange(selectedSingleService) && (
              <Input
                label="Duración"
                id="new-booking-duration"
                type="number"
                min={getServiceDurationMin(selectedSingleService)}
                max={getServiceDurationMax(selectedSingleService)}
                step="5"
                value={form.duracionServicioMin}
                onChange={(event) => updateField('duracionServicioMin')(event.target.value)}
                hint={`${formatMinutesDuration(getServiceDurationMin(selectedSingleService))} a ${formatMinutesDuration(getServiceDurationMax(selectedSingleService))}.`}
              />
            )}

            <AdminAutocomplete
              id="new-booking-staff"
              label="Profesional"
              options={staffOptions}
              selectedValue={form.idStaff}
              placeholder={form.idServicio ? 'Buscar profesional' : 'Selecciona servicio primero'}
              emptyMessage={serviceStaffQuery.isPending ? 'Cargando profesionales...' : serviceStaffQuery.isError ? 'No pudimos cargar profesionales del servicio' : 'No hay profesionales asociados'}
              disabled={!form.idServicio || serviceStaffQuery.isPending}
              getOptionValue={getPersonId}
              getOptionLabel={(member) => fullName(member) || 'Profesional'}
              getOptionMeta={(member) => member.especialidad?.nombre || member.nombreEspecialidad || member.emailContacto || 'Sin especialidad'}
              getOptionSearchText={(member) => [fullName(member), member.emailContacto, member.especialidad?.nombre, member.nombreEspecialidad].filter(Boolean).join(' ')}
              onSelect={updateField('idStaff')}
              onClear={() => updateField('idStaff')('')}
            />

            <AdminDatePicker
              label="Fecha"
              id="new-booking-date"
              value={form.fecha}
              onChange={updateField('fecha')}
              hint="Formato dd/mm/aaaa."
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
            <AdminDatePicker
              label="Fecha"
              id="multi-booking-date"
              value={form.fecha}
              onChange={updateField('fecha')}
              hint="Formato dd/mm/aaaa."
            />
          </div>
        )}

        <Input
          label="Nota interna"
          id="new-booking-note"
          as="textarea"
          rows={3}
          value={form.observacionCliente}
          onChange={(event) => {
            setForm((current) => ({ ...current, observacionCliente: event.target.value }));
            setMultiSummary(null);
          }}
          placeholder="Opcional"
        />

        <Input
          label="Abono realizado"
          id="new-booking-deposit"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={form.abono}
          onKeyDown={(event) => {
            if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
          }}
          onChange={(event) => {
            setForm((current) => ({ ...current, abono: event.target.value }));
            setFormError('');
            setSummaryError('');
            setMultiSummary(null);
          }}
          placeholder="Ej: 20000"
          hint="Obligatorio. Ingresa 0 si no hubo abono."
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
                const itemStaffOptions = item.idServicio ? item.staffOptions : [];
                const durationLabel = item.duracionServicioMin
                  ? formatMinutesDuration(item.duracionServicioMin)
                  : formatServiceDuration(service);
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
                      {renderServicePickerButton({
                        id: `multi-service-${item.id}`,
                        selectedId: item.idServicio,
                        onOpen: () => setServicePickerTarget({ type: 'multi', itemId: item.id }),
                        onClear: () => handleMultiServiceSelect(item.id, ''),
                      })}

                      {hasServiceDurationRange(service) && (
                        <Input
                          label="Duración"
                          id={`multi-duration-${item.id}`}
                          type="number"
                          min={getServiceDurationMin(service)}
                          max={getServiceDurationMax(service)}
                          step="5"
                          value={item.duracionServicioMin}
                          onChange={(event) => {
                            setFormError('');
                            setSummaryError('');
                            setMultiSummary(null);
                            updateMultiItem(item.id, (current) => ({
                              ...resetItemAvailability(current),
                              duracionServicioMin: event.target.value,
                            }));
                          }}
                          hint={`${formatMinutesDuration(getServiceDurationMin(service))} a ${formatMinutesDuration(getServiceDurationMax(service))}.`}
                        />
                      )}

                      <AdminAutocomplete
                        id={`multi-staff-${item.id}`}
                        label="Profesional"
                        options={itemStaffOptions}
                        selectedValue={item.idStaff}
                        placeholder={item.idServicio ? 'Automático o buscar profesional' : 'Selecciona servicio primero'}
                        emptyMessage={item.staffLoading ? 'Cargando profesionales...' : item.staffError || 'No hay profesionales asociados'}
                        disabled={!item.idServicio || item.staffLoading}
                        getOptionValue={getPersonId}
                        getOptionLabel={(member) => fullName(member) || 'Profesional'}
                        getOptionMeta={(member) => member.especialidad?.nombre || member.nombreEspecialidad || member.emailContacto || 'Sin especialidad'}
                        getOptionSearchText={(member) => [fullName(member), member.emailContacto, member.especialidad?.nombre, member.nombreEspecialidad].filter(Boolean).join(' ')}
                        onSelect={(value) => handleMultiStaffSelect(item.id, value)}
                        onClear={() => handleMultiStaffSelect(item.id, '')}
                      />
                    </div>

                    <div className="admin-multi-service-meta">
                      <span>{durationLabel || 'Duración por backend'}</span>
                      <span>Sin holgura interna</span>
                      {getServicePrice(service) > 0 && <span>{formatCurrencyCLP(getServicePrice(service))}</span>}
                      {item.availabilityChecked && <span>Plan validado</span>}
                    </div>

                    {index === 0 ? (
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
                    ) : (
                      <p className="admin-multi-service-auto-note">
                        <Clock size={15} />
                        Las horas se ajustarán automáticamente según el término del servicio anterior.
                      </p>
                    )}

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

                  </article>
                );
              })}
            </div>
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
      <Modal
        open={open && Boolean(multiSummary)}
        title="Resumen de agenda"
        onClose={() => {
          if (!saving) setMultiSummary(null);
        }}
        closeDisabled={saving}
        className="admin-multi-summary-modal"
      >
      {multiSummary && (
        <section className="admin-multi-summary">
          {summaryError && (
            <div className="admin-alert compact" role="alert">
              <AlertCircle size={16} />
              {summaryError}
            </div>
          )}

          <header className="admin-multi-summary-hero">
            <div>
              <p>Agenda para</p>
              <h3>{multiSummary.clientName}</h3>
              <span>{formatBookingDate(multiSummary.fecha)}</span>
            </div>
            <div className="admin-multi-summary-money">
              <span>Total estimado</span>
              <strong>{multiSummary.hasPricing ? formatCurrencyCLP(multiSummary.totalAmount) : 'No disponible'}</strong>
              <small>Abono registrado: {formatCurrencyCLP(multiSummary.abonoAmount)}</small>
              <small>Saldo pendiente: {multiSummary.hasPricing ? formatCurrencyCLP(multiSummary.saldoAmount) : 'No disponible'}</small>
            </div>
          </header>

          <div className="admin-multi-summary-kpis">
            <span>Servicios: {multiSummary.items.length}</span>
            <span>Atención total: {formatMinutesDuration(multiSummary.totalDuration)}</span>
            <span>Holgura externa: {formatMinutesDuration(multiSummary.totalBuffer)}</span>
            <span>Tiempo bloqueado: {formatMinutesDuration(multiSummary.totalBlockMinutes)}</span>
            <span>Inicio: {formatTime(multiSummary.startsAt)}</span>
            <span>Fin atención: {formatTime(multiSummary.attentionEndsAt)}</span>
            <span>Bloqueado hasta: {formatTime(multiSummary.blockedUntil)}</span>
          </div>

          <div className="admin-multi-summary-list">
            {multiSummary.items.map((item, index) => (
              <article key={item.key}>
                <div className="admin-multi-summary-order">{index + 1}</div>
                <div className="admin-multi-summary-card-main">
                  <div className="admin-multi-summary-card-head">
                    <strong>{item.serviceName}</strong>
                    {item.price > 0 && <span>{formatCurrencyCLP(item.price)}</span>}
                  </div>
                  <div className="admin-multi-summary-detail-grid">
                    <span>Profesional: {item.staffName}</span>
                    <span>{formatTime(getSlotStart(item.slot))} - {formatTime(getSlotAttentionEnd(item.slot))}</span>
                    <span>Duración: {formatMinutesDuration(item.duration)}</span>
                    <span>{item.buffer > 0 ? `Holgura externa: ${formatMinutesDuration(item.buffer)}` : 'Sin holgura interna'}</span>
                    {item.attentionType && <span>Tipo de atención: {item.attentionType}</span>}
                  </div>
                  {item.warning && <em>{item.warning}</em>}
                </div>
              </article>
            ))}
          </div>

          <footer className="admin-multi-summary-actions">
            <Button type="button" variant="ghost" onClick={() => setMultiSummary(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMultiSummary(null)} disabled={saving}>
              Volver atrás
            </Button>
            <Button type="button" onClick={handleConfirmMultiple} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <CalendarPlus size={16} />}
              {saving ? 'Creando agenda...' : 'Confirmar agenda'}
            </Button>
          </footer>
        </section>
      )}
      </Modal>
      <ServiceCategoryPickerModal
        open={open && Boolean(servicePickerTarget)}
        title={servicePickerTitle}
        services={services}
        selectedValue={servicePickerSelectedValue}
        onSelect={handleServicePickerSelect}
        onClose={() => setServicePickerTarget(null)}
      />
    </>
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

  const handleBookingCreated = ({ fecha, mode, count, clientName, horaInicio, abono }) => {
    setBookingModalOpen(false);
    setSelectedDate(fecha || '');
    setStatusFilter('TODOS');
    setServiceFilter('TODOS');
    setStaffFilter('TODOS');
    setSearchTerm('');
    const formattedDeposit = formatCurrencyCLP(Number(abono || 0));
    setSuccessMsg(mode === 'multiple'
      ? `Agenda creada correctamente: ${count || 0} servicios reservados para ${clientName || 'el cliente seleccionado'}. Abono registrado: ${formattedDeposit}.`
      : `Reserva creada correctamente para ${clientName || 'el cliente seleccionado'} el ${formatBookingDate(fecha)} a las ${formatTime(horaInicio)}. Abono registrado: ${formattedDeposit}.`);
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
          <AdminDatePicker
            label="Fecha"
            id="agenda-date"
            value={selectedDate}
            onChange={setSelectedDate}
            hint="Vacio muestra el mes actual."
            allowClear
            enforceBookingRules={false}
          />
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

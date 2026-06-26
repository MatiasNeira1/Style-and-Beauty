import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Clock, Lock, Scissors, UserRound } from 'lucide-react';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { BookingSummary } from '../../components/booking/BookingSummary.jsx';
import { DateTimePicker } from '../../components/booking/DateTimePicker.jsx';
import { reservationService } from '../../services/reservationService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { staffService } from '../../services/staffService.js';
import { HOME_HERO_IMAGE_URL, AZURE_PUBLIC_STAFF_IMAGE_URL } from '../../services/apiClient.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { useBooking } from '../../store/BookingContext.jsx';
import { useCart } from '../../store/CartContext.jsx';
import { addDays, filterBookableSlots, formatLocalDate, maxBookingDate, minBookingDate, RESERVATION_EXPIRATION_MINUTES } from '../../utils/bookingDateRules.js';
import { RESERVATION_DEPOSIT_CLP, formatCLP } from '../../utils/priceUtils.js';

const PREFERRED_CATEGORIES = ['Nails', 'Cuidados de la piel', 'Spa', 'Cabello', 'Maquillaje'];
const CATEGORY_COPY = {
  nails: 'Manicure, esmaltado y cuidado de uñas con terminaciones prolijas.',
  'cuidados de la piel': 'Tratamientos faciales y rutinas de cuidado para tu piel.',
  spa: 'Experiencias de relajación, bienestar y cuidado corporal.',
  cabello: 'Corte, color, hidratación y styling profesional.',
  maquillaje: 'Preparación de piel y maquillaje para eventos o sesiones.',
};

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(member) {
  return member?.idPersona || member?.idStaff || member?.id;
}

function serviceName(service) {
  return service?.nombre || service?.name || 'Servicio';
}

function serviceCategory(service) {
  return service?.categoria || service?.category || 'Sin categoría';
}

function serviceDescription(service) {
  return service?.descripcion || service?.description || service?.detallerservicio || 'Atención personalizada con acabado profesional.';
}

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl;
}

function serviceDuration(service) {
  return Number(service?.duracion_minutos || service?.duracionMinutos || service?.duracion || service?.duration || 0);
}

function serviceDurationLabel(service) {
  const duration = serviceDuration(service);
  return duration > 0 ? `${duration} min` : 'Duración por confirmar';
}

function servicePriceValue(service) {
  return service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.price ?? 0;
}

function servicePriceLabel(service) {
  const value = servicePriceValue(service);
  if (value === undefined || value === null || value === '') return 'Consultar';
  return formatCLP(value);
}

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function categoryKey(value = '') {
  return normalizeText(value);
}

function staffName(member) {
  return `${member?.nombre || member?.name || 'Profesional'} ${member?.apellidos || ''}`.trim();
}

function staffSpecialty(member) {
  return member?.especialidad?.nombre || member?.especialidad || member?.cargo || member?.rol || 'Especialista';
}

function staffExperience(member) {
  return member?.experiencia || member?.aniosExperiencia || member?.añosExperiencia || member?.trayectoria || '';
}

function staffDescription(member) {
  return member?.descripcionPerfil || member?.biografiaProfesional || member?.descripcion || member?.bio || 'Profesional dedicado a entregarte una experiencia segura y personalizada.';
}

function staffPhoto(member) {
  return member?.imageUrl || member?.foto || member?.fotoUrl || member?.avatar;
}

function slotEnd(slot) {
  return slot?.finAtencion || slot?.finVisible || slot?.fin || slot?.endsAt || slot?.horaFin;
}

function formatDateLabel(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function formatDateTimeLabel(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function sortSlots(slots = []) {
  return [...slots].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

async function findEarliestAvailability({ idServicio, idStaff, idCliente, fechaDesde, sameDayOnly = false }) {
  const start = fechaDesde ? new Date(`${fechaDesde}T12:00:00`) : minBookingDate();
  const limit = sameDayOnly ? start : maxBookingDate();

  for (let cursor = start; cursor <= limit; cursor = addDays(cursor, 1)) {
    const fecha = formatLocalDate(cursor);
    let slots = [];
    try {
      slots = await reservationService.getAvailability({ idServicio, idStaff, fecha, idCliente });
    } catch (error) {
      if (sameDayOnly) throw error;
      continue;
    }

    const bookable = sortSlots(filterBookableSlots(Array.isArray(slots) ? slots : []));
    if (bookable.length > 0) {
      return { fecha, slot: bookable[0] };
    }
  }

  return null;
}

function profileErrorMessage(error) {
  if (isProfileNotFoundError(error)) return 'Completa tu perfil de cliente antes de confirmar la reserva.';
  if (error?.status === 503) return 'La autenticacion del servidor no esta configurada. Intenta mas tarde.';
  return error?.message || 'No fue posible cargar tu perfil de cliente.';
}

function bookingErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();

  if (error?.status === 400) return error?.message || 'No fue posible validar la reserva con los datos seleccionados.';
  if (error?.status === 401) return 'Tu sesion expiro. Inicia sesion nuevamente para reservar.';
  if (error?.status === 403) return 'Tu cuenta no tiene permisos para crear reservas.';
  if (error?.status === 404 || isProfileNotFoundError(error)) return 'Completa tu perfil de cliente antes de confirmar la reserva.';
  if (error?.status === 503 || error?.code === 'ERR_NETWORK') return 'No pudimos conectar con el servidor.';
  if (error?.status >= 500) return 'No pudimos consultar disponibilidad. Intenta nuevamente.';
  if (message.includes('firebaseapp') || message.includes('firebase admin')) {
    return 'El servicio de autenticacion de reservas no esta disponible. Intenta mas tarde.';
  }
  if (message.includes('anteriores a hoy')) return 'No puedes reservar fechas anteriores a hoy.';
  if (message.includes('30') || message.includes('anticipacion') || message.includes('anticipación')) return 'Solo puedes reservar hasta 30 días de anticipación.';
  if (message.includes('domingo')) return 'No atendemos los domingos.';
  if (message.includes('16:00')) return 'Los sábados atendemos solo hasta las 16:00.';
  if (message.includes('solapa') || message.includes('consecutivo') || message.includes('ya tienes una cita')) {
    return 'No fue posible agregar este servicio después de tu cita anterior dentro del horario disponible. Elige otro profesional o finaliza la reserva actual.';
  }

  return error?.message || 'No se pudo crear la reserva. Intenta nuevamente.';
}

function initialFlowMode(initialService, initialProfessional) {
  if (initialService) return 'service-first';
  if (initialProfessional) return 'professional-first';
  return '';
}

function initialFlowStep(initialService, initialProfessional, initialHour, continuationMode) {
  if (initialService && initialProfessional) return 'summary';
  if (initialService) return continuationMode ? 'professional' : 'preference';
  if (initialProfessional) return 'professional-services';
  return 'start';
}

function initialPreference(initialService, initialProfessional, initialHour) {
  if (initialHour) return 'time';
  if (initialService && initialProfessional) return 'professional';
  return '';
}

export function BookingPage() {
  const { isAuthenticated, setSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateBooking } = useBooking();
  const { addReservationItem, hasReservationForService, setIsCartOpen, setLastCartError } = useCart();

  const initialService = location.state?.service || null;
  const initialProfessional = location.state?.professional || null;
  const initialHour = location.state?.selectedHour || '';
  const initialDate = location.state?.selectedDate || '';
  const initialContinuationMode = Boolean(location.state?.continuationMode && initialDate);

  const [flowMode, setFlowMode] = useState(() => initialFlowMode(initialService, initialProfessional));
  const [flowStep, setFlowStep] = useState(() => initialFlowStep(initialService, initialProfessional, initialHour, initialContinuationMode));
  const [servicePreference, setServicePreference] = useState(() => initialPreference(initialService, initialProfessional, initialHour));
  const [selectedCategory, setSelectedCategory] = useState(() => (initialService ? serviceCategory(initialService) : ''));
  const [service, setService] = useState(initialService);
  const [member, setMember] = useState(initialProfessional);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialHour);
  const [confirmError, setConfirmError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [continuationMode, setContinuationMode] = useState(initialContinuationMode);
  const [lastReservationSummary, setLastReservationSummary] = useState(null);

  const selectedServiceId = serviceId(service);
  const selectedStaffId = staffId(member);
  const hasValidServiceId = serviceCatalogService.isValidUuid(selectedServiceId);
  const hasValidStaffId = reservationService.isValidUuid(selectedStaffId);

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: serviceCatalogService.listServices,
    staleTime: 1000 * 60 * 5,
  });
  const categoryCoversQuery = useQuery({
    queryKey: ['service-category-covers'],
    queryFn: serviceCatalogService.getCategoryCovers,
    enabled: flowMode === 'service-first',
    staleTime: 1000 * 60 * 10,
  });
  const serviceStaffQuery = useQuery({
    queryKey: ['service-staff', selectedServiceId],
    queryFn: () => serviceCatalogService.listProfessionalsByService(selectedServiceId),
    enabled: hasValidServiceId,
    staleTime: 1000 * 60 * 3,
  });
  const staffQuery = useQuery({
    queryKey: ['professionals-public'],
    queryFn: staffService.listPublicStaff,
    enabled: flowMode === 'professional-first',
    staleTime: 1000 * 60 * 5,
  });
  const { data: myProfile, isError: isProfileError, error: profileError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: reservationService.getMe,
    enabled: isAuthenticated,
    retry: false,
  });

  const services = useMemo(() => (Array.isArray(servicesQuery.data) ? servicesQuery.data : []), [servicesQuery.data]);
  const serviceStaff = useMemo(() => (Array.isArray(serviceStaffQuery.data) ? serviceStaffQuery.data : []), [serviceStaffQuery.data]);
  const publicStaff = useMemo(() => (
    Array.isArray(staffQuery.data) ? staffQuery.data.filter((item) => item?.activo !== false) : []
  ), [staffQuery.data]);
  const idCliente = myProfile?.idPersona;

  const professionalServiceQueries = useQueries({
    queries: services.map((item) => {
      const id = serviceId(item);
      return {
        queryKey: ['service-staff', id],
        queryFn: () => serviceCatalogService.listProfessionalsByService(id),
        enabled: Boolean(flowMode === 'professional-first' && serviceCatalogService.isValidUuid(id)),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });

  const professionalServicesByStaff = useMemo(() => {
    const map = new Map();
    professionalServiceQueries.forEach((query, index) => {
      const relatedStaff = Array.isArray(query.data) ? query.data : [];
      relatedStaff.forEach((item) => {
        const id = staffId(item);
        if (!id) return;
        const current = map.get(id) || [];
        current.push(services[index]);
        map.set(id, current);
      });
    });
    return map;
  }, [professionalServiceQueries, services]);

  const categoryCovers = useMemo(
    () => (Array.isArray(categoryCoversQuery.data) ? categoryCoversQuery.data : []),
    [categoryCoversQuery.data],
  );
  const categories = useMemo(() => {
    const coverMap = new Map(categoryCovers.map((cover) => [categoryKey(cover.categoria), cover]));
    const grouped = new Map();

    services.forEach((item) => {
      const name = serviceCategory(item);
      const key = categoryKey(name);
      const current = grouped.get(key) || {
        key,
        name,
        services: [],
        cover: coverMap.get(key),
      };
      current.services.push(item);
      current.cover = current.cover || coverMap.get(key);
      grouped.set(key, current);
    });

    return [...grouped.values()]
      .map((category) => {
        const first = category.services[0];
        return {
          ...category,
          image: category.cover?.imagenUrl || serviceImage(first),
          description: category.cover?.descripcion || CATEGORY_COPY[category.key] || serviceDescription(first),
          count: category.services.length,
        };
      })
      .sort((a, b) => {
        const aIndex = PREFERRED_CATEGORIES.findIndex((item) => categoryKey(item) === a.key);
        const bIndex = PREFERRED_CATEGORIES.findIndex((item) => categoryKey(item) === b.key);
        const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return safeA - safeB || a.name.localeCompare(b.name, 'es');
      });
  }, [categoryCovers, services]);

  const categoryServices = useMemo(() => (
    selectedCategory
      ? services.filter((item) => categoryKey(serviceCategory(item)) === categoryKey(selectedCategory))
      : []
  ), [selectedCategory, services]);

  const serviceStaffIdsKey = useMemo(
    () => serviceStaff.map((item) => staffId(item)).filter(Boolean).join(','),
    [serviceStaff],
  );

  const staffEarliestQueries = useQueries({
    queries: serviceStaff.map((item) => {
      const id = staffId(item);
      return {
        queryKey: ['staff-earliest-availability', selectedServiceId, id, idCliente || 'anon', continuationMode ? date : 'next-30', continuationMode ? 'same-day' : 'open'],
        queryFn: () => findEarliestAvailability({
          idServicio: selectedServiceId,
          idStaff: id,
          idCliente,
          fechaDesde: continuationMode ? date : formatLocalDate(minBookingDate()),
          sameDayOnly: continuationMode,
        }),
        enabled: Boolean(
          flowMode === 'service-first'
            && flowStep === 'professional'
            && hasValidServiceId
            && reservationService.isValidUuid(id)
            && idCliente
            && (!continuationMode || date),
        ),
        retry: false,
      };
    }),
  });

  const staffEarliestById = useMemo(() => {
    const map = new Map();
    serviceStaff.forEach((item, index) => {
      map.set(staffId(item), staffEarliestQueries[index]?.data || null);
    });
    return map;
  }, [serviceStaff, staffEarliestQueries]);

  const timeAvailabilityQuery = useQuery({
    queryKey: ['service-time-availability', selectedServiceId, date, idCliente || 'anon', serviceStaffIdsKey],
    queryFn: async () => {
      const settled = await Promise.allSettled(serviceStaff.map(async (item) => {
        const id = staffId(item);
        const slots = await reservationService.getAvailability({
          idServicio: selectedServiceId,
          idStaff: id,
          fecha: date,
          idCliente,
        });
        return { staff: item, slots: filterBookableSlots(Array.isArray(slots) ? slots : []) };
      }));
      const fulfilled = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
      const rejected = settled.find((item) => item.status === 'rejected');
      if (!fulfilled.length && rejected) throw rejected.reason;
      return fulfilled;
    },
    enabled: Boolean(
      flowMode === 'service-first'
        && servicePreference === 'time'
        && flowStep === 'time'
        && !continuationMode
        && hasValidServiceId
        && date
        && idCliente
        && serviceStaff.length > 0,
    ),
    retry: false,
  });

  const timeFirstSlots = useMemo(() => {
    const grouped = new Map();
    const entries = Array.isArray(timeAvailabilityQuery.data) ? timeAvailabilityQuery.data : [];

    entries.forEach(({ staff, slots }) => {
      slots.forEach((slot) => {
        if (!slot?.inicio) return;
        const current = grouped.get(slot.inicio) || {
          ...slot,
          staffOptions: [],
          staffSlotsById: {},
        };
        const id = staffId(staff);
        current.staffOptions.push(staff);
        current.staffSlotsById[id] = slot;
        grouped.set(slot.inicio, current);
      });
    });

    return sortSlots([...grouped.values()]);
  }, [timeAvailabilityQuery.data]);

  const selectedTimeFirstSlot = useMemo(() => timeFirstSlots.find((slot) => slot.inicio === time), [timeFirstSlots, time]);
  const timeFirstStaffOptions = selectedTimeFirstSlot?.staffOptions || [];
  const selectedTimeFirstStaffSlot = selectedTimeFirstSlot?.staffSlotsById?.[selectedStaffId] || null;

  const automaticScheduleFlow = Boolean(
    flowStep === 'summary'
      && service
      && member
      && (continuationMode || servicePreference === 'professional' || flowMode === 'professional-first')
      && !(servicePreference === 'time' && time),
  );

  const earliestAvailabilityQuery = useQuery({
    queryKey: ['earliest-availability', selectedServiceId, selectedStaffId, idCliente || 'anon', continuationMode ? date : 'next-30', continuationMode ? 'same-day' : 'open'],
    queryFn: () => findEarliestAvailability({
      idServicio: selectedServiceId,
      idStaff: selectedStaffId,
      idCliente,
      fechaDesde: continuationMode ? date : formatLocalDate(minBookingDate()),
      sameDayOnly: continuationMode,
    }),
    enabled: Boolean(automaticScheduleFlow && hasValidServiceId && hasValidStaffId && idCliente && (!continuationMode || date)),
    retry: false,
  });

  const manualAvailabilityQuery = useQuery({
    queryKey: ['availability', selectedStaffId, selectedServiceId, date, idCliente || 'anon'],
    queryFn: () => reservationService.getAvailability({
      idServicio: selectedServiceId,
      idStaff: selectedStaffId,
      fecha: date,
      idCliente,
    }),
    enabled: Boolean(flowStep === 'summary' && !automaticScheduleFlow && hasValidStaffId && hasValidServiceId && date && idCliente),
  });

  const manualAvailableSlots = useMemo(
    () => filterBookableSlots(Array.isArray(manualAvailabilityQuery.data) ? manualAvailabilityQuery.data : []),
    [manualAvailabilityQuery.data],
  );

  const manualSelectedSlot = useMemo(() => (
    selectedTimeFirstStaffSlot || manualAvailableSlots.find((slot) => slot.inicio === time) || selectedTimeFirstSlot || null
  ), [manualAvailableSlots, selectedTimeFirstSlot, selectedTimeFirstStaffSlot, time]);

  const automaticResult = earliestAvailabilityQuery.data;
  const summarySlot = automaticScheduleFlow ? automaticResult?.slot : manualSelectedSlot;
  const summaryDate = automaticScheduleFlow ? automaticResult?.fecha : date;
  const summaryTime = automaticScheduleFlow ? automaticResult?.slot?.inicio : time;
  const summaryEnd = slotEnd(summarySlot);

  const selectedProfessionalServices = useMemo(() => {
    if (!member) return [];
    const embedded = member.serviciosAsociados || member.servicios || member.services || [];
    if (Array.isArray(embedded) && embedded.length > 0) {
      return embedded.map((item) => {
        const id = typeof item === 'string' ? item : serviceId(item);
        return services.find((candidate) => serviceId(candidate) === id) || (typeof item === 'object' ? item : null);
      }).filter(Boolean);
    }
    return professionalServicesByStaff.get(selectedStaffId) || [];
  }, [member, professionalServicesByStaff, selectedStaffId, services]);

  const profileMessage = isProfileError
    ? profileErrorMessage(profileError)
    : !myProfile?.idPersona ? 'Completa tu perfil para poder reservar.' : '';

  const bookingMutation = useMutation({
    mutationFn: reservationService.createReservation,
    onSuccess: async (created, variables) => {
      const createdDate = variables?.startsAt ? formatLocalDate(new Date(variables.startsAt)) : date;
      await queryClient.invalidateQueries({ queryKey: ['availability', variables?.professionalId, variables?.serviceId, createdDate, idCliente || 'anon'] });
      await queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      return created;
    },
  });

  const resetSelectionForNextService = () => {
    setFlowMode('');
    setFlowStep('start');
    setServicePreference('');
    setSelectedCategory('');
    setService(null);
    setMember(null);
    setTime('');
    setConfirmError('');
    setSuccessNotice('');
  };

  const beginFollowUp = () => {
    if (!lastReservationSummary) return;
    setSuccessModalOpen(false);
    setContinuationMode(true);
    setDate(lastReservationSummary.date);
    resetSelectionForNextService();
  };

  const finishFlow = () => {
    setSuccessModalOpen(false);
    setSuccessNotice('Reserva agregada correctamente. Revisa el carrito para finalizar el pago.');
    setIsCartOpen(true);
  };

  const goBack = () => {
    setConfirmError('');
    if (!flowMode || flowStep === 'start') {
      setFlowMode('');
      setFlowStep('start');
      return;
    }

    if (flowMode === 'service-first') {
      if (flowStep === 'categories') {
        setFlowMode('');
        setFlowStep('start');
      } else if (flowStep === 'services') {
        setFlowStep('categories');
      } else if (flowStep === 'preference') {
        setFlowStep('services');
      } else if (flowStep === 'professional') {
        setFlowStep(continuationMode ? 'services' : 'preference');
      } else if (flowStep === 'time') {
        setFlowStep('preference');
      } else if (flowStep === 'summary') {
        setFlowStep(servicePreference === 'time' && !continuationMode ? 'time' : 'professional');
      }
      return;
    }

    if (flowStep === 'professional') {
      setFlowMode('');
      setFlowStep('start');
    } else if (flowStep === 'professional-services') {
      setFlowStep('professional');
    } else if (flowStep === 'summary') {
      setFlowStep('professional-services');
    }
  };

  const confirm = async () => {
    setConfirmError('');
    setSuccessNotice('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!service || !member || !summaryDate || !summaryTime) {
      setConfirmError('Selecciona servicio, profesional y horario validado para continuar.');
      return;
    }
    if (!hasValidServiceId || !hasValidStaffId) {
      setConfirmError('Selecciona servicio y profesional validos para continuar.');
      return;
    }
    if (profileMessage) {
      setConfirmError(profileMessage);
      return;
    }
    if (hasReservationForService(selectedServiceId)) {
      const message = 'Ya tienes una reserva temporal para este servicio en el carrito.';
      setConfirmError(message);
      setLastCartError(message);
      return;
    }
    if (automaticScheduleFlow && earliestAvailabilityQuery.isFetching) {
      setConfirmError('Estamos calculando el horario más temprano disponible.');
      return;
    }
    if (!summarySlot) {
      setConfirmError(continuationMode
        ? 'No fue posible agregar este servicio después de tu cita anterior dentro del horario disponible. Elige otro profesional o finaliza la reserva actual.'
        : 'No encontramos horarios disponibles para esta selección.');
      return;
    }

    setAgregandoCarrito(true);
    try {
      const freshSlots = await reservationService.getAvailability({
        idServicio: selectedServiceId,
        idStaff: selectedStaffId,
        fecha: summaryDate,
        idCliente,
      });
      const stillAvailable = filterBookableSlots(Array.isArray(freshSlots) ? freshSlots : [])
        .some((slot) => slot.inicio === summaryTime);

      if (!stillAvailable) {
        setTime('');
        throw new Error(continuationMode
          ? 'No fue posible agregar este servicio después de tu cita anterior dentro del horario disponible. Elige otro profesional o finaliza la reserva actual.'
          : 'El horario seleccionado ya no esta disponible. Elige otra hora.');
      }

      const refreshedSession = await firebaseAuthService.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
      }

      const created = await bookingMutation.mutateAsync({
        clientId: myProfile?.idPersona,
        professionalId: selectedStaffId,
        serviceId: selectedServiceId,
        startsAt: summaryTime,
        note: continuationMode ? 'Servicio agregado inmediatamente posterior desde agenda cliente' : undefined,
      });

      const createdSummary = {
        idCita: created.idCita,
        service,
        staff: member,
        serviceName: serviceName(service),
        staffName: staffName(member),
        date: summaryDate,
        startsAt: created.fechaHoraInicio || summaryTime,
        endsAt: created.fechaHoraFinAtencion || created.fechaHoraFin || summaryEnd,
        blockedUntil: created.fechaHoraFin,
        price: servicePriceValue(service),
        duration: created?.duracionServicioMin || summarySlot?.duracionServicioMin || serviceDuration(service),
        holguraMin: created?.holguraMin,
      };

      updateBooking({
        service,
        staff: member,
        date: summaryDate,
        time: createdSummary.startsAt,
        holguraMin: createdSummary.holguraMin,
        duracionServicioMin: createdSummary.duration,
      });

      const addResult = addReservationItem({
        id: `reservation:${created.idCita}`,
        reservationId: created.idCita,
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        name: createdSummary.serviceName,
        price: createdSummary.price,
        serviceValue: createdSummary.price,
        abono: RESERVATION_DEPOSIT_CLP,
        depositAmount: RESERVATION_DEPOSIT_CLP,
        startsAt: createdSummary.startsAt,
        endsAt: createdSummary.endsAt,
        blockedUntil: createdSummary.blockedUntil,
        expiresAt: created.expiracionReserva,
        duracionServicioMin: createdSummary.duration,
        holguraMin: createdSummary.holguraMin,
        service,
        staff: member,
        date: summaryDate,
        time: createdSummary.startsAt,
      });

      if (!addResult.ok) {
        await reservationService.cancelReservation(created.idCita);
        setConfirmError(addResult.error);
        return;
      }

      setLastReservationSummary(createdSummary);
      setContinuationMode(false);
      setConfirmError('');
      setSuccessModalOpen(true);
    } catch (error) {
      setConfirmError(bookingErrorMessage(error));
    } finally {
      setAgregandoCarrito(false);
    }
  };

  const startServiceFirst = () => {
    resetSelectionForNextService();
    setFlowMode('service-first');
    setFlowStep('categories');
  };

  const startProfessionalFirst = () => {
    resetSelectionForNextService();
    setFlowMode('professional-first');
    setFlowStep('professional');
  };

  const selectService = (value) => {
    setService(value);
    setMember(null);
    setTime('');
    setConfirmError('');
    if (!continuationMode) setDate('');
    if (continuationMode) {
      setServicePreference('professional');
      setFlowStep('professional');
    } else {
      setFlowStep('preference');
    }
  };

  const selectProfessional = (value, nextStep = 'summary') => {
    setMember(value);
    setTime('');
    setConfirmError('');
    setFlowStep(nextStep);
  };

  const progressItems = flowMode === 'professional-first'
    ? ['Inicio', 'Profesional', 'Servicio', 'Horario', 'Resumen']
    : ['Inicio', 'Servicio', 'Preferencia', 'Fecha/Horario', 'Resumen'];
  const progressStep = progressIndex(flowMode, flowStep, servicePreference);

  const canConfirm = Boolean(
    service
      && member
      && summaryDate
      && summaryTime
      && summarySlot
      && !profileMessage
      && !bookingMutation.isPending
      && !agregandoCarrito
      && !earliestAvailabilityQuery.isFetching
      && !manualAvailabilityQuery.isFetching,
  );

  if (!isAuthenticated) {
    return (
      <>
        <BookingHero />
        <section className="page-section client-auth-gate">
          <Card className="client-auth-card">
            <div className="client-auth-icon"><Lock size={32} /></div>
            <h2>Inicia sesion para reservar</h2>
            <p>Necesitamos asociar tu cita a tu perfil para confirmar horarios, notificaciones y pagos.</p>
            <Button onClick={() => navigate('/login', { state: { from: location } })}>Ir a iniciar sesion</Button>
          </Card>
        </section>
      </>
    );
  }

  return (
    <>
      <BookingHero />
      <section className={`page-section booking-shell client-view${flowStep === 'summary' ? ' booking-shell--with-summary' : ''}`}>
        <div className="stack wizard-panel">
          <SectionTitle eyebrow="Agenda inteligente" title="Reserva guiada con disponibilidad real">
            Elige cómo comenzar y avanza solo con las opciones que corresponden a tu selección.
          </SectionTitle>

          <Card className="booking-wizard-card">
            <WizardProgress items={progressItems} current={progressStep} />

            {continuationMode && (
              <div className="booking-followup-note">
                <strong>El siguiente servicio se agendará automáticamente en el horario disponible más cercano posterior al término de tu cita anterior. No podrás seleccionar una hora manualmente en este flujo.</strong>
              </div>
            )}

            {successNotice && <p className="admin-success">{successNotice}</p>}

            {flowStep === 'start' && (
              <StartChoice onServiceFirst={startServiceFirst} onProfessionalFirst={startProfessionalFirst} />
            )}

            {flowMode === 'service-first' && flowStep === 'categories' && (
              <StepBlock eyebrow="Servicio primero" title="Selecciona una categoría">
                {servicesQuery.isLoading ? (
                  <Loader />
                ) : servicesQuery.isError ? (
                  <p className="admin-alert">No pudimos cargar categorías disponibles por el momento.</p>
                ) : categories.length === 0 ? (
                  <p className="admin-alert">No hay categorías disponibles por el momento.</p>
                ) : (
                  <CategoryGrid
                    categories={categories}
                    selected={selectedCategory}
                    onSelect={(category) => {
                      setSelectedCategory(category.name);
                      setFlowStep('services');
                      setConfirmError('');
                    }}
                  />
                )}
              </StepBlock>
            )}

            {flowMode === 'service-first' && flowStep === 'services' && (
              <StepBlock eyebrow={selectedCategory || 'Categoría'} title="Elige el servicio">
                {categoryServices.length === 0 ? (
                  <p className="admin-alert">No hay servicios disponibles en esta categoría.</p>
                ) : (
                  <ServiceGrid services={categoryServices} selectedId={selectedServiceId} onSelect={selectService} />
                )}
              </StepBlock>
            )}

            {flowMode === 'service-first' && flowStep === 'preference' && (
              <StepBlock eyebrow={serviceName(service)} title="¿Qué prefieres elegir ahora?">
                <div className="booking-choice-grid booking-choice-grid--two">
                  <button
                    type="button"
                    className="booking-choice-card"
                    onClick={() => {
                      setServicePreference('professional');
                      setMember(null);
                      setTime('');
                      setFlowStep('professional');
                    }}
                  >
                    <UserRound size={24} />
                    <strong>Elegir profesional</strong>
                    <span>Ver especialistas que realizan este servicio y confirmar el horario más temprano disponible.</span>
                  </button>
                  <button
                    type="button"
                    className="booking-choice-card"
                    onClick={() => {
                      setServicePreference('time');
                      setMember(null);
                      setTime('');
                      setDate('');
                      setFlowStep('time');
                    }}
                  >
                    <Clock size={24} />
                    <strong>Elegir horario</strong>
                    <span>Escoger fecha y bloque primero para mostrar solo profesionales disponibles.</span>
                  </button>
                </div>
              </StepBlock>
            )}

            {flowMode === 'service-first' && flowStep === 'professional' && (
              <StepBlock eyebrow={serviceName(service)} title="Elige profesional">
                {serviceStaffQuery.isLoading ? (
                  <Loader />
                ) : serviceStaffQuery.isError ? (
                  <p className="admin-alert">No fue posible cargar profesionales.</p>
                ) : serviceStaff.length === 0 ? (
                  <p className="admin-alert">No hay profesionales disponibles para este servicio.</p>
                ) : (
                  <ProfessionalGrid
                    professionals={serviceStaff}
                    selectedId={selectedStaffId}
                    servicesByStaff={new Map(serviceStaff.map((item) => [staffId(item), [service]]))}
                    availabilityByStaff={staffEarliestById}
                    availabilityLoading={staffEarliestQueries.some((query) => query.isLoading || query.isFetching)}
                    service={service}
                    onSelect={(value) => selectProfessional(value)}
                  />
                )}
              </StepBlock>
            )}

            {flowMode === 'service-first' && flowStep === 'time' && (
              <StepBlock eyebrow={serviceName(service)} title="Elige fecha y horario">
                {serviceStaffQuery.isLoading ? (
                  <Loader />
                ) : serviceStaff.length === 0 ? (
                  <p className="admin-alert">No hay profesionales disponibles para este servicio.</p>
                ) : (
                  <>
                    <DateTimePicker
                      date={date}
                      time={time}
                      slots={timeFirstSlots}
                      isLoading={timeAvailabilityQuery.isLoading || timeAvailabilityQuery.isFetching}
                      error={timeAvailabilityQuery.error?.message || (date && !timeAvailabilityQuery.isFetching && timeFirstSlots.length === 0 ? 'No encontramos horarios disponibles para esta selección.' : '')}
                      onDateChange={(value) => {
                        setDate(value);
                        setTime('');
                        setMember(null);
                        setConfirmError('');
                      }}
                      onTimeChange={(value) => {
                        setTime(value);
                        setMember(null);
                        setConfirmError('');
                      }}
                    />

                    {time && (
                      <div className="booking-time-staff-panel">
                        <div>
                          <span className="card-kicker">Profesionales disponibles</span>
                          <h3>Estos profesionales están disponibles para el horario seleccionado.</h3>
                        </div>
                        {timeFirstStaffOptions.length === 0 ? (
                          <p className="admin-alert">No hay profesionales disponibles para este horario. Selecciona otra hora.</p>
                        ) : (
                          <ProfessionalGrid
                            professionals={timeFirstStaffOptions}
                            selectedId={selectedStaffId}
                            servicesByStaff={new Map(timeFirstStaffOptions.map((item) => [staffId(item), [service]]))}
                            service={service}
                            compact
                            onSelect={(value) => selectProfessional(value)}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </StepBlock>
            )}

            {flowMode === 'professional-first' && flowStep === 'professional' && (
              <StepBlock eyebrow="Profesional primero" title="Elige profesional">
                {staffQuery.isLoading ? (
                  <Loader />
                ) : staffQuery.isError ? (
                  <p className="admin-alert">No pudimos cargar profesionales reales.</p>
                ) : publicStaff.length === 0 ? (
                  <p className="admin-alert">No hay profesionales disponibles por el momento.</p>
                ) : (
                  <ProfessionalGrid
                    professionals={publicStaff}
                    selectedId={selectedStaffId}
                    servicesByStaff={professionalServicesByStaff}
                    servicesLoading={professionalServiceQueries.some((query) => query.isLoading || query.isFetching)}
                    onSelect={(value) => selectProfessional(value, 'professional-services')}
                  />
                )}
              </StepBlock>
            )}

            {flowMode === 'professional-first' && flowStep === 'professional-services' && (
              <StepBlock eyebrow={staffName(member)} title="Elige un servicio de este profesional">
                {servicesQuery.isLoading || professionalServiceQueries.some((query) => query.isLoading || query.isFetching) ? (
                  <Loader />
                ) : selectedProfessionalServices.length === 0 ? (
                  <p className="admin-alert">No hay servicios disponibles para este profesional.</p>
                ) : (
                  <ServiceGrid
                    services={selectedProfessionalServices}
                    selectedId={selectedServiceId}
                    onSelect={(value) => {
                      setService(value);
                      setServicePreference('professional');
                      setTime('');
                      setConfirmError('');
                      setFlowStep('summary');
                    }}
                  />
                )}
              </StepBlock>
            )}

            {flowStep === 'summary' && (
              <StepBlock eyebrow="Resumen" title={continuationMode ? 'Confirma el servicio posterior' : 'Confirma tu reserva'}>
                <div className="booking-confirmation-stack">
                  {continuationMode && lastReservationSummary && (
                    <PreviousAppointmentSummary reservation={lastReservationSummary} />
                  )}

                  {automaticScheduleFlow && (
                    <EarliestAvailabilityPanel
                      isLoading={earliestAvailabilityQuery.isLoading || earliestAvailabilityQuery.isFetching}
                      result={automaticResult}
                      service={service}
                      professional={member}
                      continuationMode={continuationMode}
                      error={earliestAvailabilityQuery.error}
                    />
                  )}

                  {!automaticScheduleFlow && summarySlot && (
                    <div className="booking-earliest-card">
                      <Clock size={20} />
                      <div>
                        <strong>{formatTime(summaryTime)} - {formatTime(summaryEnd)}</strong>
                        <span>{serviceDurationLabel(service)} · {staffName(member)}</span>
                      </div>
                    </div>
                  )}

                  {profileMessage && (
                    <p className="admin-alert">
                      {profileMessage}
                      <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/perfil')}>Ir a mi perfil</Button>
                    </p>
                  )}

                  {confirmError && <p className="admin-alert">{confirmError}</p>}

                  <div className="wizard-actions">
                    <Button type="button" variant="ghost" onClick={goBack}>
                      {continuationMode ? 'Cambiar servicio/profesional' : 'Volver'}
                    </Button>
                    {continuationMode && (
                      <Button type="button" variant="secondary" onClick={finishFlow}>
                        Finalizar
                      </Button>
                    )}
                    <Button type="button" onClick={confirm} disabled={!canConfirm}>
                      {agregandoCarrito || bookingMutation.isPending
                        ? 'Confirmando...'
                        : continuationMode ? 'Agregar servicio inmediatamente posterior' : 'Confirmar reserva'}
                    </Button>
                  </div>
                </div>
              </StepBlock>
            )}

            {flowStep !== 'summary' && (
              <div className="wizard-actions">
                <Button type="button" variant="ghost" disabled={flowStep === 'start'} onClick={goBack}>
                  <ArrowLeft size={16} /> Volver
                </Button>
              </div>
            )}
          </Card>
        </div>

        {flowStep === 'summary' && (
          <aside className="booking-summary-panel">
            <BookingSummary service={service} staff={member} date={summaryDate} time={summaryTime} slot={summarySlot} />
            {continuationMode && lastReservationSummary && summarySlot && (
              <Card className="summary-card booking-total-summary">
                <h3>Total acumulado</h3>
                <p>Cita anterior: {formatCLP(lastReservationSummary.price)}</p>
                <p>Nuevo servicio: {servicePriceLabel(service)}</p>
                <strong>Total: {formatCLP(Number(lastReservationSummary.price || 0) + Number(servicePriceValue(service) || 0))}</strong>
              </Card>
            )}
          </aside>
        )}
      </section>

      <Modal
        open={successModalOpen}
        title="Reserva creada correctamente"
        onClose={finishFlow}
        className="booking-followup-modal"
      >
        <SuccessReservationContent reservation={lastReservationSummary} />
        <p>Tienes {RESERVATION_EXPIRATION_MINUTES} minutos para confirmarla antes de que el horario se libere.</p>
        <p>¿Deseas agregar otro servicio inmediatamente después de esta cita?</p>
        <div className="auth-reservation-actions">
          <Button type="button" onClick={beginFollowUp}>
            Agregar otro servicio
          </Button>
          <Button type="button" variant="secondary" onClick={finishFlow}>
            Finalizar
          </Button>
        </div>
      </Modal>
    </>
  );
}

function progressIndex(flowMode, flowStep, servicePreference) {
  if (!flowMode || flowStep === 'start') return 1;
  if (flowMode === 'professional-first') {
    if (flowStep === 'professional') return 2;
    if (flowStep === 'professional-services') return 3;
    if (flowStep === 'summary') return 5;
    return 1;
  }
  if (flowStep === 'categories' || flowStep === 'services') return 2;
  if (flowStep === 'preference') return 3;
  if (flowStep === 'professional' || flowStep === 'time') return servicePreference === 'professional' ? 4 : 4;
  if (flowStep === 'summary') return 5;
  return 1;
}

function WizardProgress({ items, current }) {
  return (
    <div className="booking-progress" aria-label={`Paso ${current} de ${items.length}`}>
      <span>Paso {current} de {items.length}</span>
      <div>
        {items.map((item, index) => (
          <Badge key={item} tone={index + 1 <= current ? 'primary' : 'neutral'}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function StepBlock({ eyebrow, title, children }) {
  return (
    <div className="booking-step-block">
      <div className="booking-step-heading">
        <span className="card-kicker">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StartChoice({ onServiceFirst, onProfessionalFirst }) {
  return (
    <StepBlock eyebrow="Paso inicial" title="¿Cómo quieres comenzar tu reserva?">
      <div className="booking-choice-grid booking-choice-grid--two">
        <button type="button" className="booking-choice-card booking-choice-card--primary" onClick={onServiceFirst}>
          <Scissors size={28} />
          <strong>Elegir servicio primero</strong>
          <span>Parte por categoría, revisa detalles del servicio y luego elige profesional u horario.</span>
        </button>
        <button type="button" className="booking-choice-card" onClick={onProfessionalFirst}>
          <UserRound size={28} />
          <strong>Elegir profesional primero</strong>
          <span>Selecciona especialista, ve los servicios que realiza y confirma su horario más temprano.</span>
        </button>
      </div>
    </StepBlock>
  );
}

function CategoryGrid({ categories, selected, onSelect }) {
  return (
    <div className="booking-category-grid">
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          className={`booking-category-card ${category.name === selected ? 'is-selected' : ''}`}
          onClick={() => onSelect(category)}
        >
          <SafeImage src={category.image} alt={category.name} className="booking-category-image" />
          <span className="card-kicker">{category.count} servicios</span>
          <strong>{category.name}</strong>
          <p>{category.description}</p>
        </button>
      ))}
    </div>
  );
}

function ServiceGrid({ services, selectedId, onSelect }) {
  return (
    <div className="booking-compact-grid">
      {services.map((item) => {
        const id = serviceId(item);
        const selected = id === selectedId;
        return (
          <button
            key={id || serviceName(item)}
            type="button"
            className={`booking-service-card ${selected ? 'is-selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            <SafeImage className="booking-service-image" src={serviceImage(item)} alt={serviceName(item)} />
            <span className="card-kicker">{serviceCategory(item)}</span>
            <strong>{serviceName(item)}</strong>
            <p>{serviceDescription(item)}</p>
            <dl>
              <div>
                <dt>Duración</dt>
                <dd>{serviceDurationLabel(item)}</dd>
              </div>
              <div>
                <dt>Precio</dt>
                <dd>{servicePriceLabel(item)}</dd>
              </div>
            </dl>
          </button>
        );
      })}
    </div>
  );
}

function ProfessionalGrid({
  professionals,
  selectedId,
  servicesByStaff = new Map(),
  servicesLoading = false,
  availabilityByStaff = new Map(),
  availabilityLoading = false,
  service,
  compact = false,
  onSelect,
}) {
  return (
    <div className={compact ? 'booking-professional-grid booking-professional-grid--compact' : 'booking-professional-grid'}>
      {professionals.map((professional) => {
        const id = staffId(professional);
        const selected = id === selectedId;
        const services = servicesByStaff.get(id) || [];
        const earliest = availabilityByStaff.get(id);
        const hasAvailabilityInfo = availabilityByStaff.has(id);
        return (
          <button
            key={id || staffName(professional)}
            type="button"
            className={`booking-professional-card ${selected ? 'is-selected' : ''}`}
            onClick={() => onSelect(professional)}
          >
            <SafeImage
              src={staffPhoto(professional)}
              alt={staffName(professional)}
              fallback={AZURE_PUBLIC_STAFF_IMAGE_URL}
              className="booking-professional-photo"
            />
            <div className="booking-professional-body">
              <span className="card-kicker">{staffSpecialty(professional)}</span>
              <strong>{staffName(professional)}</strong>
              <p>{staffDescription(professional)}</p>
              <div className="booking-meta-row">
                {staffExperience(professional) && <span>{staffExperience(professional)}</span>}
                {service && <span>{serviceDurationLabel(service)} · {servicePriceLabel(service)}</span>}
              </div>
              <div className="booking-service-tags">
                {servicesLoading ? (
                  <span>Servicios en consulta</span>
                ) : services.length > 0 ? (
                  services.slice(0, 3).map((item) => <span key={serviceId(item) || serviceName(item)}>{serviceName(item)}</span>)
                ) : (
                  <span>Servicios según disponibilidad</span>
                )}
              </div>
              {availabilityLoading ? (
                <small>Buscando próximo horario...</small>
              ) : hasAvailabilityInfo ? (
                earliest?.slot ? (
                  <small>Próximo horario: {formatDateLabel(earliest.fecha)} · {formatTime(earliest.slot.inicio)}</small>
                ) : (
                  <small>Sin horarios disponibles próximos</small>
                )
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EarliestAvailabilityPanel({ isLoading, result, service, professional, continuationMode, error }) {
  if (isLoading) {
    return (
      <div className="booking-earliest-card is-loading">
        <Clock size={20} />
        <div>
          <strong>Buscando horario más temprano disponible...</strong>
          <span>Validando agenda, jornada laboral y reservas existentes.</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="admin-alert">{bookingErrorMessage(error)}</p>;
  }

  if (!result?.slot) {
    return (
      <p className="admin-alert">
        {continuationMode
          ? 'No fue posible agregar este servicio después de tu cita anterior dentro del horario disponible. Elige otro profesional o finaliza la reserva actual.'
          : 'No encontramos horarios disponibles para este profesional con el servicio seleccionado.'}
      </p>
    );
  }

  return (
    <div className="booking-earliest-card">
      <CalendarCheck size={20} />
      <div>
        <span className="card-kicker">
          {continuationMode ? 'Horario calculado automáticamente' : 'Horario más temprano disponible para este profesional'}
        </span>
        <strong>{formatDateLabel(result.fecha)} · {formatTime(result.slot.inicio)} - {formatTime(slotEnd(result.slot))}</strong>
        <span>
          {continuationMode
            ? 'La nueva cita queda inmediatamente posterior a la cita anterior si el backend mantiene esta disponibilidad.'
            : 'Te asignaremos el horario más temprano disponible con este profesional.'}
        </span>
        <small>{serviceName(service)} · {staffName(professional)} · {serviceDurationLabel(service)} · {servicePriceLabel(service)}</small>
      </div>
    </div>
  );
}

function PreviousAppointmentSummary({ reservation }) {
  return (
    <div className="booking-previous-card">
      <span className="card-kicker">Cita anterior</span>
      <strong>{reservation.serviceName}</strong>
      <p>{reservation.staffName}</p>
      <dl>
        <div>
          <dt>Inicio</dt>
          <dd>{formatDateTimeLabel(reservation.startsAt)}</dd>
        </div>
        <div>
          <dt>Término</dt>
          <dd>{formatDateTimeLabel(reservation.endsAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

function SuccessReservationContent({ reservation }) {
  if (!reservation) return null;
  return (
    <div className="booking-success-summary">
      <dl>
        <div>
          <dt>Servicio reservado</dt>
          <dd>{reservation.serviceName}</dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{reservation.staffName}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{formatDateLabel(reservation.date)}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{formatTime(reservation.startsAt)} - {formatTime(reservation.endsAt)}</dd>
        </div>
        <div>
          <dt>Precio</dt>
          <dd>{formatCLP(reservation.price)}</dd>
        </div>
      </dl>
    </div>
  );
}

function BookingHero() {
  return (
    <section
      className="page-hero page-hero-booking"
      style={{ '--page-hero-image': `url("${HOME_HERO_IMAGE_URL}")` }}
    >
      <div className="page-hero-content">
        <span className="eyebrow">Reserva cliente</span>
        <h1>Agenda tu momento con disponibilidad real</h1>
        <p>Elige servicio o profesional y confirma una hora validada por agenda.</p>
      </div>
    </section>
  );
}

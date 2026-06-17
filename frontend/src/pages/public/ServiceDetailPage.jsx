import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { AuthModal } from '../../components/auth/AuthModal.jsx';
import { ProfessionalProfileModal } from '../../components/professionals/ProfessionalProfileModal.jsx';
import { ProfessionalProfiles } from '../../components/services/ProfessionalProfiles.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { agendaService } from '../../services/agendaService.js';
import { catalogService } from '../../services/catalogService.js';
import { reservationService } from '../../services/reservationService.js';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';
import { useAuth } from '../../store/AuthContext.jsx';
import { useCart } from '../../store/CartContext.jsx';
import { categorySlug, findCategoryBySlug, groupByCategory } from '../../utils/categoryUtils.js';
import { isBookingDateAllowed, maxBookingDate, RESERVATION_EXPIRATION_MINUTES } from '../../utils/bookingDateRules.js';

function servicePrice(service) {
  const value = service?.precio_total ?? service?.precio ?? service?.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function serviceDuration(service) {
  return service?.duracion_minutos || service?.duracion || service?.duration || 45;
}

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl;
}

function serviceMatchesSlug(service, slug) {
  const names = [
    service?.nombre,
    service?.name,
    service?.id_servicio,
    service?.idServicio,
    service?.id,
  ].filter(Boolean);

  return names.some((value) => categorySlug(value) === slug);
}

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function staffId(professional) {
  return professional?.idStaff || professional?.idPersona || professional?.id;
}

function formatSlotTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatLongDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`));
}

function parseLocalDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function weekDays(start) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function weekRangeLabel(start) {
  const end = addDays(start, 6);
  const startLabel = new Intl.DateTimeFormat('es-CL', { day: 'numeric' }).format(start);
  const endLabel = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' }).format(end);
  return `${startLabel} al ${endLabel}`;
}

function professionalName(professional) {
  return `${professional?.nombre || ''} ${professional?.apellidos || ''}`.trim() || professional?.fullName || 'Especialista';
}

function profileForModal(professional, service) {
  if (!professional) return null;

  const fullName = professionalName(professional);
  const specialty = professional.especialidad?.nombre || professional.especialidad || professional.cargo || service?.nombre || service?.name || 'Especialista';

  return {
    ...professional,
    id: staffId(professional),
    fullName,
    especialidad: specialty,
    cargo: professional.cargo || specialty,
    estado: professional.activo === false ? 'No disponible' : professional.estado || 'Disponible',
    descripcion: professional.descripcionPerfil || professional.descripcion || professional.especialidad?.descripcion,
    trayectoria: professional.trayectoria || professional.descripcionPerfil,
    imageUrl: professional.imageUrl || professional.fotoUrl || professional.foto,
  };
}

function profileErrorMessage(error) {
  if (isProfileNotFoundError(error)) return 'Completa tu perfil de cliente antes de confirmar la reserva.';
  if (error?.status === 503) return 'La autenticacion del servidor no esta configurada. Intenta mas tarde.';
  return error?.message || 'No se pudo cargar tu perfil de cliente.';
}

export function ServiceDetailPage() {
  const { categoria, servicio } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, setSession } = useAuth();
  const { addReservationItem, hasReservationForService, setIsCartOpen, setLastCartError } = useCart();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: reservationService.getMe,
    enabled: isAuthenticated,
    retry: false,
  });

  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false);
  const [errorProfesionales, setErrorProfesionales] = useState('');
  const [semanaInicio, setSemanaInicio] = useState(() => getStartOfWeek(new Date()));
  const [disponibilidadSemana, setDisponibilidadSemana] = useState({});
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [observacionCliente, setObservacionCliente] = useState('');
  const [mensajeReserva, setMensajeReserva] = useState('');
  const [creandoCita, setCreandoCita] = useState(false);
  const [perfilStaffVisible, setPerfilStaffVisible] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const availabilityWeekCache = useRef(new Map());
  const pendingReservationRef = useRef(null);

  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const grouped = groupByCategory(services);
  const categories = Object.keys(grouped);
  const category = findCategoryBySlug(categories, categoria) || categories[0] || 'General';
  const categoryServices = grouped[category] || [];
  const service = categoryServices.find((item) => serviceMatchesSlug(item, servicio));
  const idServicio = serviceId(service);
  const idServicioValido = reservationService.isValidUuid(idServicio);

  const savePendingReservation = () => {
    const pending = {
      idServicio,
      servicio: service,
      profesionalSeleccionado,
      fechaSeleccionada,
      horarioSeleccionado,
      observacionCliente,
    };
    sessionStorage.setItem('reservaPendiente', JSON.stringify(pending));
    return pending;
  };

  const goToAuth = (path) => {
    savePendingReservation();
    navigate(path, {
      state: {
        from: {
          pathname: location.pathname,
          state: { reservaPendiente: true },
        },
      },
    });
  };

  useEffect(() => {
    if (!idServicioValido) return undefined;

    let active = true;
    setCargandoProfesionales(true);
    setErrorProfesionales('');
    setProfesionales([]);
    setProfesionalSeleccionado(null);
    setDisponibilidadSemana({});
    setFechaSeleccionada('');
    setHorariosDisponibles([]);
    setHorarioSeleccionado(null);

    agendaService.listarStaffPorServicio(idServicio)
      .then((response) => {
        if (active) setProfesionales(Array.isArray(response) ? response : []);
      })
      .catch((error) => {
        if (active) setErrorProfesionales(error.message || 'No pudimos cargar los especialistas de este servicio.');
      })
      .finally(() => {
        if (active) setCargandoProfesionales(false);
      });

    return () => {
      active = false;
    };
  }, [idServicio, idServicioValido]);

  useEffect(() => {
    if (!idServicio || profesionales.length === 0 || profesionalSeleccionado) return;

    try {
      const rawPending = sessionStorage.getItem('reservaPendiente');
      if (!rawPending) return;

      const pending = JSON.parse(rawPending);
      if (pending?.idServicio !== idServicio || !pending?.profesionalSeleccionado) return;

      const pendingStaffId = staffId(pending.profesionalSeleccionado);
      const professional = profesionales.find((item) => staffId(item) === pendingStaffId);
      if (!professional) return;

      pendingReservationRef.current = pending;
      setProfesionalSeleccionado(professional);
      setObservacionCliente(pending.observacionCliente || '');
      if (pending.fechaSeleccionada) {
        setSemanaInicio(getStartOfWeek(parseLocalDate(pending.fechaSeleccionada)));
      }
      if (location.state?.reservaPendiente) {
        setMensajeReserva('Sesion iniciada. Ahora puedes confirmar tu reserva.');
      }
    } catch {
      sessionStorage.removeItem('reservaPendiente');
    }
  }, [idServicio, location.state, profesionalSeleccionado, profesionales]);

  useEffect(() => {
    const idStaff = staffId(profesionalSeleccionado);
    const idStaffValido = reservationService.isValidUuid(idStaff);
    if (!idServicioValido || !idStaffValido) {
      setDisponibilidadSemana({});
      setFechaSeleccionada('');
      setHorariosDisponibles([]);
      setHorarioSeleccionado(null);
      return undefined;
    }

    let active = true;
    setCargandoDisponibilidad(true);
    setErrorDisponibilidad('');
    setDisponibilidadSemana({});
    setFechaSeleccionada('');
    setHorariosDisponibles([]);
    setHorarioSeleccionado(null);

    const dias = weekDays(semanaInicio);
    const fechaInicioSemana = formatLocalDate(semanaInicio);
    const weekKey = `${idServicio}:${idStaff}:${fechaInicioSemana}`;

    if (availabilityWeekCache.current.has(weekKey)) {
      setDisponibilidadSemana(availabilityWeekCache.current.get(weekKey));
      setCargandoDisponibilidad(false);
      return undefined;
    }

    const payload = { idServicio, idStaff, fecha: fechaInicioSemana };

    const loadWeeklyAvailability = async () => {
      try {
        const response = await agendaService.consultarDisponibilidadSemanal(payload);

        const weeklyAvailability = Object.fromEntries(dias.map((dia) => [formatLocalDate(dia), []]));
        if (Array.isArray(response)) {
          response.forEach((dia) => {
            if (dia?.fecha) {
              weeklyAvailability[dia.fecha] = Array.isArray(dia.slots) ? dia.slots : [];
            }
          });
        }

        return weeklyAvailability;
      } catch (error) {
        if (![404, 405].includes(error.status)) {
          throw error;
        }

        const entries = await Promise.all(dias.map(async (dia) => {
          const fecha = formatLocalDate(dia);
          const dailyPayload = { idServicio, idStaff, fecha };
          const response = await agendaService.consultarDisponibilidad(dailyPayload);
          return [fecha, Array.isArray(response) ? response : []];
        }));

        return Object.fromEntries(entries);
      }
    };

    loadWeeklyAvailability()
      .then((weeklyAvailability) => {
        availabilityWeekCache.current.set(weekKey, weeklyAvailability);
        if (active) setDisponibilidadSemana(weeklyAvailability);
      })
      .catch((error) => {
        if (active) setErrorDisponibilidad(error.message || 'No se pudo cargar la disponibilidad. Intenta nuevamente.');
      })
      .finally(() => {
        if (active) setCargandoDisponibilidad(false);
      });

    return () => {
      active = false;
    };
  }, [idServicio, idServicioValido, profesionalSeleccionado, semanaInicio]);

  useEffect(() => {
    const pending = pendingReservationRef.current;
    if (!pending?.fechaSeleccionada || !pending?.horarioSeleccionado) return;

    const slots = disponibilidadSemana[pending.fechaSeleccionada];
    if (!Array.isArray(slots)) return;

    const slot = slots.find((item) => item.inicio === pending.horarioSeleccionado.inicio);
    if (!slot) return;

    setFechaSeleccionada(pending.fechaSeleccionada);
    setHorariosDisponibles(slots);
    setHorarioSeleccionado(slot);
    pendingReservationRef.current = null;
    sessionStorage.removeItem('reservaPendiente');
  }, [disponibilidadSemana]);

  const handleWeekChange = (offset) => {
    setSemanaInicio((current) => addDays(current, offset * 7));
    setMensajeReserva('');
  };

  const handleSelectProfessional = (profesional) => {
    setProfesionalSeleccionado(profesional);
    setSemanaInicio(getStartOfWeek(new Date()));
    setDisponibilidadSemana({});
    setFechaSeleccionada('');
    setHorariosDisponibles([]);
    setHorarioSeleccionado(null);
    setMensajeReserva('');
  };

  const handleSelectDay = (fecha) => {
    setFechaSeleccionada(fecha);
    setHorariosDisponibles(disponibilidadSemana[fecha] || []);
    setHorarioSeleccionado(null);
    setMensajeReserva('');
  };

  const handleCreateBooking = async () => {
    setMensajeReserva('');

    if (!profesionalSeleccionado) {
      setMensajeReserva('Selecciona un especialista.');
      return;
    }
    if (!fechaSeleccionada) {
      setMensajeReserva('Selecciona una fecha.');
      return;
    }
    if (!horarioSeleccionado) {
      setMensajeReserva('Selecciona una hora disponible.');
      return;
    }
    if (!idServicioValido || !reservationService.isValidUuid(staffId(profesionalSeleccionado))) {
      setMensajeReserva('Selecciona un servicio y especialista validos.');
      return;
    }
    if (!isAuthenticated) {
      savePendingReservation();
      setAuthModalOpen(true);
      return;
    }
    if (profileQuery.isLoading) {
      setMensajeReserva('Estamos cargando tu perfil de cliente. Intenta nuevamente en unos segundos.');
      return;
    }
    if (profileQuery.isError) {
      setMensajeReserva(profileErrorMessage(profileQuery.error));
      return;
    }
    if (!profileQuery.data?.idPersona) {
      setMensajeReserva('Completa tu perfil de cliente antes de confirmar la reserva.');
      return;
    }
    if (hasReservationForService(idServicio)) {
      const message = 'Ya tienes una reserva temporal para este servicio en el carrito.';
      setMensajeReserva(message);
      setLastCartError(message);
      setIsCartOpen(true);
      return;
    }

    setCreandoCita(true);
    try {
      const refreshedSession = await firebaseAuthService.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
      }

      const citaCreada = await agendaService.crearCita({
        idCliente: profileQuery.data?.idPersona,
        idStaff: staffId(profesionalSeleccionado),
        idServicio,
        fechaHoraInicio: horarioSeleccionado.inicio,
        observacionCliente,
      });

      const horarioReservado = horarioSeleccionado.inicio;
      const addResult = addReservationItem({
        id: `reservation:${citaCreada.idCita}`,
        reservationId: citaCreada.idCita,
        serviceId: idServicio,
        staffId: staffId(profesionalSeleccionado),
        name: service?.nombre || service?.name || 'Reserva',
        price: service?.precio_total ?? service?.precio ?? service?.price ?? 0,
        startsAt: citaCreada.fechaHoraInicio || horarioReservado,
        endsAt: citaCreada.fechaHoraFin,
        expiresAt: citaCreada.expiracionReserva,
        duracionServicioMin: citaCreada?.duracionServicioMin,
        holguraMin: citaCreada?.holguraMin,
        service,
        staff: profesionalSeleccionado,
        date: fechaSeleccionada,
        time: horarioReservado,
        observacionCliente,
      });

      if (!addResult.ok) {
        await reservationService.cancelReservation(citaCreada.idCita);
        setMensajeReserva(addResult.error);
        return;
      }

      const horariosActualizados = horariosDisponibles.filter((horario) => horario.inicio !== horarioReservado);
      setDisponibilidadSemana((current) => ({
        ...current,
        [fechaSeleccionada]: (current[fechaSeleccionada] || []).filter((horario) => horario.inicio !== horarioReservado),
      }));
      setHorariosDisponibles(horariosActualizados);
      setHorarioSeleccionado(null);
      availabilityWeekCache.current.delete(`${idServicio}:${staffId(profesionalSeleccionado)}:${formatLocalDate(semanaInicio)}`);
      await queryClient.invalidateQueries({ queryKey: ['agenda-admin'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-snapshot'] });
      setMensajeReserva(`Reserva agregada al carrito. Tienes ${RESERVATION_EXPIRATION_MINUTES} minutos para confirmarla antes de que el horario se libere.`);
      setObservacionCliente('');
    } catch (error) {
      const message = error.message || '';
      if (message.toLowerCase().includes('perfil') || message.toLowerCase().includes('cliente')) {
        setMensajeReserva('No se pudo identificar tu perfil de cliente. Inicia sesion nuevamente o completa tu registro.');
      } else {
        setMensajeReserva(message || 'No se pudo agregar la reserva al carrito. Intenta nuevamente.');
      }
    } finally {
      setCreandoCita(false);
    }
  };

  const diasSemana = weekDays(semanaInicio);
  const fechasSemana = diasSemana.map(formatLocalDate);
  const semanaCargada = fechasSemana.every((fecha) => Array.isArray(disponibilidadSemana[fecha]));
  const sinDisponibilidadSemana = profesionalSeleccionado
    && !cargandoDisponibilidad
    && !errorDisponibilidad
    && semanaCargada
    && fechasSemana.every((fecha) => (disponibilidadSemana[fecha] || []).length === 0);
  const nextWeekStart = addDays(semanaInicio, 7);
  const previousWeekEnd = addDays(semanaInicio, -1);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const canGoNextWeek = nextWeekStart <= maxBookingDate();
  const canGoPrevWeek = previousWeekEnd >= today;

  if (servicesQuery.isLoading) {
    return (
      <section className="page-section standalone-page-section">
        <Loader />
      </section>
    );
  }

  if (servicesQuery.isError) {
    return (
      <section className="page-section standalone-page-section">
        <p className="admin-alert">{servicesQuery.error?.message}</p>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="page-section standalone-page-section">
        <Link className="text-link service-back-link" to="/servicios">
          <ArrowLeft size={16} />
          Servicios
        </Link>
        <p className="admin-alert">El servicio solicitado no existe en el catalogo.</p>
      </section>
    );
  }

  return (
    <section className="service-detail-page">
      <div className="service-detail-banner">
        <SafeImage className="service-detail-banner-image" src={serviceImage(service)} alt={service.nombre || service.name || 'Servicio'} />
        <div className="service-detail-banner-overlay" />
        <div className="service-detail-banner-inner">
          <Link className="service-detail-back" to={`/servicios/${categorySlug(category)}`}>
            <ArrowLeft size={16} />
            {category}
          </Link>
          <span className="card-kicker">{category}</span>
          <h1>{service.nombre || service.name || 'Servicio'}</h1>
          <p>{service.descripcion || service.description || 'Atencion personalizada con tecnica profesional y seguimiento cercano.'}</p>
          <div className="service-detail-meta">
            <strong>{servicePrice(service)}</strong>
            <span><Clock size={15} /> {serviceDuration(service)} min</span>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="service-detail-content">
          <section className="service-description-panel">
            <span className="card-kicker">Detalle del servicio</span>
            <h2>{service.nombre || service.name || 'Servicio personalizado'}</h2>
            <p>{service.detallerservicio || service.description || 'Este servicio se adapta al diagnostico del profesional y a tus preferencias.'}</p>
            <a className="button button-sm" href="#reservar-servicio">
              <CalendarDays size={16} />
              Reservar
            </a>
          </section>

          <section className="service-professionals-section" id="reservar-servicio">
            <span className="card-kicker">Profesionales</span>
            <h2>Especialistas disponibles</h2>
            {cargandoProfesionales && <p className="professional-empty">Cargando especialistas asociados...</p>}
            {errorProfesionales && <p className="admin-alert">{errorProfesionales}</p>}
            <ProfessionalProfiles
              professionals={profesionales}
              emptyText="No hay especialistas asignados a este servicio por el momento."
              selectedId={staffId(profesionalSeleccionado)}
              actionLabel="Seleccionar"
              onViewProfile={(profesional) => setPerfilStaffVisible(profileForModal(profesional, service))}
              onSelect={handleSelectProfessional}
            />
            {/* Este estado depende de la relacion servicio_staff en ms-catalogo. */}
            {/* Para mostrar especialistas, se debe asociar staff al servicio usando POST /api/servicio-staff. */}

            <div className="service-booking-panel">
              <div className="service-week-header">
                <button type="button" className="button button-sm button-secondary" onClick={() => handleWeekChange(-1)} disabled={!canGoPrevWeek}>
                  Semana anterior
                </button>
                <div>
                  <span className="card-kicker">Disponibilidad semanal</span>
                  <h3>Selecciona tu hora</h3>
                  <p>Semana desde el {weekRangeLabel(semanaInicio)}</p>
                </div>
                <button type="button" className="button button-sm button-secondary" onClick={() => handleWeekChange(1)} disabled={!canGoNextWeek}>
                  Semana siguiente
                </button>
              </div>

              {cargandoDisponibilidad && <p className="professional-empty">Consultando disponibilidad de la semana...</p>}
              {errorDisponibilidad && <p className="admin-alert">{errorDisponibilidad}</p>}
              {!profesionalSeleccionado && <p className="professional-empty">Selecciona un especialista para ver sus horas disponibles.</p>}
              {sinDisponibilidadSemana && <p className="professional-empty">Este especialista no tiene horas disponibles para esta semana.</p>}

              {profesionalSeleccionado && !cargandoDisponibilidad && !errorDisponibilidad && semanaCargada && (
                <div className="service-week-grid">
                  {diasSemana.map((dia) => {
                    const fecha = formatLocalDate(dia);
                    const slots = disponibilidadSemana[fecha] || [];
                    const dateAllowed = isBookingDateAllowed(fecha);
                    const available = dateAllowed && slots.length > 0;
                    const selected = fechaSeleccionada === fecha;

                    return (
                      <button
                        key={fecha}
                        type="button"
                        className={selected ? 'service-week-day is-selected' : 'service-week-day'}
                        disabled={!dateAllowed}
                        onClick={() => handleSelectDay(fecha)}
                      >
                        <strong>{new Intl.DateTimeFormat('es-CL', { weekday: 'short' }).format(dia)}</strong>
                        <em>{new Intl.DateTimeFormat('es-CL', { day: '2-digit' }).format(dia)}</em>
                        <span className={available ? 'is-available' : ''}>{available ? 'Disponible' : 'Sin horas'}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="service-booking-grid">
                <label className="field">
                  <span>Observacion</span>
                  <textarea
                    rows={3}
                    placeholder="Primera cita"
                    value={observacionCliente}
                    onChange={(event) => setObservacionCliente(event.target.value)}
                  />
                </label>
              </div>

              <div className="service-slots-panel">
                <span className="card-kicker">Disponibilidad</span>
                <h3>Horarios disponibles</h3>
                {fechaSeleccionada && <h3>{formatLongDate(fechaSeleccionada)}</h3>}
                <p className="service-slots-helper">Selecciona una hora disponible. La reserva bloqueara el tiempo completo del servicio.</p>
                {!profesionalSeleccionado && <p className="professional-empty">Selecciona un especialista para ver sus horarios disponibles.</p>}
                {!fechaSeleccionada && profesionalSeleccionado && <p className="professional-empty">Selecciona un dia de la semana.</p>}
                {fechaSeleccionada && horariosDisponibles.length === 0 && (
                  <p className="professional-empty">No hay horas disponibles para este día.</p>
                )}
                <div className="service-slot-list">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario.inicio}
                      type="button"
                      className={horarioSeleccionado?.inicio === horario.inicio ? 'service-slot is-selected' : 'service-slot'}
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      {formatSlotTime(horario.inicio)} - {formatSlotTime(horario.finVisible)}
                    </button>
                  ))}
                </div>
              </div>

              {horarioSeleccionado && (
                <div className="service-booking-summary">
                  <span className="card-kicker">Resumen</span>
                  <dl>
                    <div>
                      <dt>Servicio</dt>
                      <dd>{service.nombre || service.name || 'Servicio'}</dd>
                    </div>
                    <div>
                      <dt>Profesional</dt>
                      <dd>{professionalName(profesionalSeleccionado)}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{formatLongDate(fechaSeleccionada)}</dd>
                    </div>
                    <div>
                      <dt>Hora</dt>
                      <dd>{formatSlotTime(horarioSeleccionado.inicio)} a {formatSlotTime(horarioSeleccionado.finVisible)}</dd>
                    </div>
                    <div>
                      <dt>Duracion</dt>
                      <dd>{horarioSeleccionado.duracionServicioMin || serviceDuration(service)} min</dd>
                    </div>
                    <div>
                      <dt>Precio</dt>
                      <dd>{servicePrice(service)}</dd>
                    </div>
                    {observacionCliente && (
                      <div>
                        <dt>Observacion</dt>
                        <dd>{observacionCliente}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {profileQuery.isError && isAuthenticated && (
                <p className="admin-alert">{profileErrorMessage(profileQuery.error)}</p>
              )}
              {mensajeReserva && <p className={mensajeReserva.includes('agregada al carrito') ? 'service-booking-success' : 'admin-alert'}>{mensajeReserva}</p>}
              <button
                type="button"
                className="button"
                onClick={handleCreateBooking}
                disabled={creandoCita || (isAuthenticated && (profileQuery.isLoading || profileQuery.isError || !profileQuery.data?.idPersona))}
              >
                <CalendarDays size={17} />
                {creandoCita ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>
          </section>
        </div>
      </Reveal>

      <ProfessionalProfileModal professional={perfilStaffVisible} onClose={() => setPerfilStaffVisible(null)} />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={() => goToAuth('/login')}
        onRegister={() => goToAuth('/registro')}
      />
    </section>
  );
}

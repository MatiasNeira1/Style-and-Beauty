import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock, Image as ImageIcon, MapPin, Signal, Sparkles, X } from 'lucide-react';
import { SafeImage } from '../ui/SafeImage.jsx';
import { professionalTheme, statusTone } from '../../utils/professionalTheme.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { agendaService } from '../../services/agendaService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { STAFF_QUERY_OPTIONS, staffService } from '../../services/staffService.js';
import { addDays, filterBookableSlots, formatLocalDate, minBookingDate, parseLocalDate } from '../../utils/bookingDateRules.js';

const INITIAL_WORK_DAYS = 3;
const WORK_DAYS_INCREMENT = 3;
const MAX_WORK_DAYS = 9;
const SEARCH_LIMIT_DAYS = 21;
const AVAILABILITY_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
  gcTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
};

function normalize(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function portfolioFor(professional) {
  const images = professional?.portfolioImages || professional?.portfolio || professional?.trabajos || professional?.galeria || [];
  const normalized = Array.isArray(images) ? images : [];
  return normalized
    .map((image) => (typeof image === 'string' ? image : image?.urlFoto || image?.url || image?.imageUrl || image?.src))
    .filter(Boolean);
}

function serviceName(service) {
  if (typeof service === 'string') return service;
  return service?.nombre
    || service?.nombreServicio
    || service?.nombre_servicio
    || service?.name
    || service?.label
    || service?.titulo
    || service?.descripcion;
}

function serviceId(service) {
  if (typeof service === 'string') return '';
  return service?.id_servicio || service?.idServicio || service?.id || '';
}

function staffId(professional) {
  return professional?.idPersona
    || professional?.idStaff
    || professional?.id
    || professional?.raw?.idPersona
    || professional?.raw?.idStaff
    || professional?.raw?.id
    || '';
}

function isActiveService(service) {
  return service?.activo !== false;
}

function servicesFor(professional) {
  const assignedServices = professional?.serviciosAsociados || professional?.servicios || professional?.services || [];
  const normalizedServices = Array.isArray(assignedServices)
    ? assignedServices.filter((service) => serviceName(service))
    : [];
  return normalizedServices;
}

function specialtiesFor(professional) {
  const values = [
    ...(Array.isArray(professional?.especialidades) ? professional.especialidades : []),
    professional?.especialidad,
    professional?.cargo,
  ]
    .map((value) => (typeof value === 'string' ? value : value?.nombre || value?.name || value?.label))
    .filter(Boolean);

  return Array.from(new Set(values.map(String)));
}

function yearsWithUs(professional) {
  const explicitYears = professional?.experienciaAnios || professional?.aniosExperiencia || professional?.anosExperiencia;
  if (explicitYears) {
    return `${explicitYears} anos de experiencia`;
  }

  const numericId = Number(String(professional?.id || '').match(/\d+/)?.[0] || 1);
  return `${(numericId % 4) + 1} años junto a Style & Beauty`;
}

function formatSlotTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function formatAvailabilityDayLabel(value) {
  const date = parseLocalDate(value);
  if (!date) return value;
  const label = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function agendaWeekday(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function activeWorkdays(schedules = []) {
  return new Set(
    schedules
      .filter((schedule) => schedule?.activo !== false)
      .map((schedule) => Number(schedule?.diaSemana))
      .filter((day) => day >= 1 && day <= 6)
  );
}

function sortSlots(slots = []) {
  return [...slots].sort((left, right) => new Date(left.inicio).getTime() - new Date(right.inicio).getTime());
}

function publicStatus(value) {
  if (!value || normalize(value).includes('consultar disponibilidad')) return 'Agenda según servicio';
  return value;
}

async function loadUpcomingAvailability({ idStaff, idServicio, schedules, requiredDays }) {
  const workdays = activeWorkdays(schedules);
  if (!workdays.size) {
    return { days: [], canLoadMore: false };
  }

  const start = minBookingDate();
  const maxDate = addDays(start, SEARCH_LIMIT_DAYS);
  const seenDates = new Set();
  const days = [];

  for (let cursor = start; cursor <= maxDate && days.length < requiredDays; cursor = addDays(cursor, 7)) {
    const week = await agendaService.consultarDisponibilidadSemanal({
      idStaff,
      idServicio,
      fecha: formatLocalDate(cursor),
    });

    const rows = Array.isArray(week) ? week : [];
    rows
      .slice()
      .sort((left, right) => String(left.fecha).localeCompare(String(right.fecha)))
      .forEach((row) => {
        if (days.length >= requiredDays) return;

        const date = parseLocalDate(row?.fecha);
        if (!date || date < start || date > maxDate) return;
        const weekday = agendaWeekday(date);
        const dateKey = formatLocalDate(date);
        if (!workdays.has(weekday) || seenDates.has(dateKey)) return;

        seenDates.add(dateKey);
        days.push({
          fecha: dateKey,
          label: formatAvailabilityDayLabel(dateKey),
          slots: sortSlots(filterBookableSlots(row?.slots || [])),
        });
      });
  }

  return {
    days,
    canLoadMore: days.length >= requiredDays && requiredDays < MAX_WORK_DAYS,
  };
}

function mergeServices(...groups) {
  const map = new Map();
  groups.flat().filter(Boolean).forEach((service) => {
    const id = serviceId(service);
    const key = id || normalize(serviceName(service));
    if (key && !map.has(key)) map.set(key, service);
  });
  return [...map.values()];
}

export function ProfessionalProfileModal({ professional, onClose, showBookingAction = true }) {
  const selectedStaffId = staffId(professional);
  const detailQuery = useQuery({
    queryKey: ['professional-detail', selectedStaffId],
    queryFn: () => staffService.getStaffById(selectedStaffId),
    enabled: Boolean(professional && staffService.isValidUuid(selectedStaffId)),
    ...STAFF_QUERY_OPTIONS,
  });
  const professionalView = useMemo(() => {
    if (!professional || !detailQuery.data) return professional;
    const detail = detailQuery.data;
    const nombre = detail.nombre || professional.nombre;
    const apellidos = detail.apellidos || professional.apellidos;
    return {
      ...professional,
      raw: { ...professional.raw, ...detail },
      id: detail.idStaff || detail.idPersona || professional.id,
      idStaff: detail.idStaff || professional.idStaff,
      idPersona: detail.idPersona || detail.idStaff || professional.idPersona,
      nombre,
      apellidos,
      fullName: `${nombre || ''} ${apellidos || ''}`.trim() || professional.fullName,
      cargo: detail.especialidad || professional.cargo,
      especialidad: detail.especialidad || professional.especialidad,
      descripcion: detail.descripcionPerfil || professional.descripcion,
      trayectoria: detail.descripcionPerfil || professional.trayectoria,
      biografiaProfesional: detail.descripcionPerfil || professional.biografiaProfesional,
      perfilCurricular: detail.descripcionPerfil || professional.perfilCurricular,
      fotoUrl: detail.fotoUrl || professional.fotoUrl,
      experienciaAnios: detail.experienciaAnios ?? professional.experienciaAnios,
      portfolioImages: Array.isArray(detail.portfolioImages) ? detail.portfolioImages : professional.portfolioImages,
    };
  }, [detailQuery.data, professional]);
  const theme = professionalTheme(professionalView?.especialidad);
  const statusLabel = publicStatus(professionalView?.estado);
  const tone = statusTone(statusLabel);
  const portfolio = useMemo(() => portfolioFor(professionalView), [professionalView]);
  const declaredServices = useMemo(() => servicesFor(professionalView), [professionalView]);
  const specialties = useMemo(() => specialtiesFor(professionalView), [professionalView]);
  const primarySpecialty = specialties[0] || '';
  const nextHour = professionalView?.proximaHora || professionalView?.proximasHoras?.[0] || '';
  const biography = professionalView?.biografiaProfesional || professionalView?.descripcionPerfil || professionalView?.descripcion || 'Atencion personalizada con diagnostico, tecnica cuidada y acabado profesional.';
  const curriculum = professionalView?.perfilCurricular || professionalView?.trayectoria || professionalView?.descripcionPerfil || `${professionalView?.fullName || 'El profesional'} combina tecnica, criterio estetico y una experiencia cercana para crear resultados pulidos y naturales.`;
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [visibleWorkDays, setVisibleWorkDays] = useState(INITIAL_WORK_DAYS);
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState(null);
  const hasPortfolio = portfolio.length > 0;
  useBodyScrollLock(Boolean(professional));

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: serviceCatalogService.listServices,
    enabled: Boolean(professional),
    staleTime: 1000 * 60 * 5,
  });
  const activeServices = useMemo(() => (
    Array.isArray(servicesQuery.data) ? servicesQuery.data.filter(isActiveService) : []
  ), [servicesQuery.data]);
  const serviceStaffQueries = useQueries({
    queries: activeServices.map((service) => {
      const id = serviceId(service);
      return {
        queryKey: ['service-staff', id],
        queryFn: () => serviceCatalogService.listProfessionalsByService(id),
        enabled: Boolean(professional && selectedStaffId && serviceCatalogService.isValidUuid(id)),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });
  const relationServices = useMemo(() => {
    if (!selectedStaffId) return [];
    return activeServices.filter((service, index) => {
      const rows = serviceStaffQueries[index]?.data;
      return Array.isArray(rows) && rows.some((member) => staffId(member) === selectedStaffId);
    });
  }, [activeServices, selectedStaffId, serviceStaffQueries]);
  const declaredServiceObjects = useMemo(() => (
    declaredServices.map((item) => {
      if (typeof item !== 'string' && serviceId(item) && isActiveService(item)) return item;
      const name = serviceName(item);
      return activeServices.find((service) => normalize(serviceName(service)) === normalize(name));
    }).filter(Boolean)
  ), [activeServices, declaredServices]);
  const services = useMemo(() => mergeServices(relationServices, declaredServiceObjects), [declaredServiceObjects, relationServices]);
  const servicesLoading = servicesQuery.isLoading || serviceStaffQueries.some((query) => query.isLoading || query.isFetching);
  const servicesError = services.length === 0 && (servicesQuery.isError || serviceStaffQueries.some((query) => query.isError));
  const selectedService = services.find((service) => serviceId(service) === selectedServiceId) || null;
  const schedulesQuery = useQuery({
    queryKey: ['staff-public-schedules', selectedStaffId],
    queryFn: () => staffService.listPublicSchedules(selectedStaffId),
    enabled: Boolean(professional && staffService.isValidUuid(selectedStaffId)),
    ...STAFF_QUERY_OPTIONS,
  });
  const availabilityQuery = useQuery({
    queryKey: ['professional-upcoming-availability', selectedStaffId, selectedServiceId, visibleWorkDays],
    queryFn: () => loadUpcomingAvailability({
      idStaff: selectedStaffId,
      idServicio: selectedServiceId,
      schedules: schedulesQuery.data,
      requiredDays: visibleWorkDays,
    }),
    enabled: Boolean(
      professional
        && staffService.isValidUuid(selectedStaffId)
        && serviceCatalogService.isValidUuid(selectedServiceId)
        && schedulesQuery.isSuccess
        && !servicesLoading
        && !servicesError
    ),
    ...AVAILABILITY_QUERY_OPTIONS,
  });
  const availabilityDays = availabilityQuery.data?.days || [];
  const availabilityLoading = schedulesQuery.isLoading || availabilityQuery.isLoading || availabilityQuery.isFetching;
  const availabilityError = schedulesQuery.isError || availabilityQuery.isError;
  const selectedServiceLabel = selectedService ? serviceName(selectedService) : '';
  const selectedSlotLabel = selectedAvailabilitySlot
    ? `${formatAvailabilityDayLabel(selectedAvailabilitySlot.date)} · ${formatSlotTime(selectedAvailabilitySlot.inicio)}`
    : '';
  const canLoadMoreAvailability = Boolean(availabilityQuery.data?.canLoadMore);

  useEffect(() => {
    if (!professional) return;
    setSelectedAvailabilitySlot(null);
    setVisibleWorkDays(INITIAL_WORK_DAYS);
  }, [professional]);

  useEffect(() => {
    const firstId = serviceId(services[0]);
    if (!firstId) {
      setSelectedServiceId('');
      return;
    }
    if (!services.some((service) => serviceId(service) === selectedServiceId)) {
      setSelectedServiceId(firstId);
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    setSelectedAvailabilitySlot(null);
    setVisibleWorkDays(INITIAL_WORK_DAYS);
  }, [selectedServiceId, selectedStaffId]);

  useEffect(() => {
    if (!professional) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [professional, onClose]);

  return createPortal(
    <AnimatePresence>
      {professional && (
        <motion.div
          className="professional-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.article
            className="professional-profile-modal"
            style={{ '--specialty-color': professionalView?.colorEspecialidad || theme.color, '--specialty-soft': theme.soft }}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="professional-profile-title"
            data-lenis-prevent
          >
            <button type="button" className="professional-modal-close" onClick={onClose} aria-label="Cerrar perfil">
              <X size={18} />
            </button>

            <div className="professional-modal-hero">
              <div className="professional-modal-photo">
                <SafeImage src={professionalView.imageUrl || professionalView.fotoUrl} alt={professionalView.fullName} fallback="/logo.jpg" />
              </div>
              <div className="professional-modal-intro">
                <span className="professional-specialty"><Sparkles size={14} /> {professionalView.especialidad || professionalView.cargo}</span>
                <h2 id="professional-profile-title">{professionalView.fullName}</h2>
                <p>{biography}</p>
                <div className="professional-modal-meta">
                  <span><MapPin size={15} /> Sucursal: {professionalView.sucursal || 'Providencia'}</span>
                  <span className={`professional-modal-status ${tone}`}><Signal size={15} /> Estado: {statusLabel}</span>
                  {nextHour ? (
                    <span><Clock size={15} /> Próximas horas disponibles: {nextHour}</span>
                  ) : (
                    <span><Clock size={15} /> Horarios reales por servicio</span>
                  )}
                </div>
              </div>
            </div>

            <div className="professional-modal-grid">
              <section>
                <span className="modal-section-kicker">Trayectoria</span>
                <h3>Perfil curricular</h3>
                <p>
                  {curriculum}
                </p>
                <div className="professional-modal-stat">
                  <strong>{yearsWithUs(professionalView)}</strong>
                  <span>Experiencia curada para clientas que buscan precision, calma y resultados consistentes.</span>
                </div>
              </section>

              <section>
                <span className="modal-section-kicker">Servicios</span>
                <h3>Especialidades y servicios</h3>
                <div className="professional-service-groups">
                  <div className="professional-service-group">
                    <span className="professional-group-label">Especialidad</span>
                    {primarySpecialty ? (
                      <span className="professional-specialty-badge">{primarySpecialty}</span>
                    ) : (
                      <p>Especialidad no configurada.</p>
                    )}
                  </div>
                  <div className="professional-service-group">
                    <span className="professional-group-label">Servicios disponibles</span>
                    <div className="professional-service-chip-list">
                      {servicesLoading && <span>Servicios activos en consulta</span>}
                      {!servicesLoading && services.map((service, index) => (
                        <span key={`service-${serviceId(service) || index}`}>{serviceName(service)}</span>
                      ))}
                    </div>
                    {!servicesLoading && services.length === 0 && (
                      <p>Este profesional aún no tiene servicios asociados.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <section className="professional-modal-gallery" aria-label="Galería de trabajos realizados">
              {hasPortfolio ? (
                portfolio.map((image, index) => (
                  <SafeImage
                    key={image || `portfolio-${index}`}
                    src={image}
                    alt={`Trabajo realizado ${index + 1} por ${professionalView.fullName}`}
                    fallback="/logo.jpg"
                  />
                ))
              ) : (
                <div className="professional-modal-empty-gallery">
                  <ImageIcon size={24} />
                  <strong>Portafolio pendiente</strong>
                  <span>Las imagenes publicadas por el profesional apareceran aqui.</span>
                </div>
              )}
            </section>

            <div className={`professional-modal-footer ${showBookingAction ? '' : 'is-single'}`}>
              <div className="professional-availability-main">
                <span className="modal-section-kicker">Disponibilidad real</span>
                <div className="professional-availability-controls">
                  {services.length > 1 && (
                    <label>
                      <span>Servicio</span>
                      <select value={selectedServiceId} onChange={(event) => {
                        setSelectedServiceId(event.target.value);
                      }}>
                        {services.map((service) => (
                          <option key={serviceId(service)} value={serviceId(service)}>{serviceName(service)}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {servicesError && <p className="professional-availability-message is-error">No pudimos validar servicios activos asociados.</p>}
                {!servicesLoading && services.length === 0 && (
                  <p className="professional-availability-message">Este profesional no tiene servicios activos asociados para consultar agenda.</p>
                )}
                {services.length > 0 && (
                  <div className="professional-availability-panel">
                    <div className="professional-availability-heading">
                      <h3>Próximas horas disponibles</h3>
                      <p>Buscamos los próximos días reales de atención del profesional.</p>
                    </div>

                    {availabilityLoading && (
                      <p className="professional-availability-message">Buscando las próximas horas disponibles...</p>
                    )}
                    {availabilityError && (
                      <p className="professional-availability-message is-error">No pudimos consultar disponibilidad en este momento. Intenta nuevamente.</p>
                    )}
                    {!availabilityLoading && !availabilityError && availabilityDays.length === 0 && (
                      <p className="professional-availability-message">No encontramos horas disponibles en los próximos días de atención. Prueba con otro servicio o revisa más horarios.</p>
                    )}
                    {!availabilityLoading && !availabilityError && availabilityDays.length > 0 && (
                      <div className="professional-availability-days" data-lenis-prevent>
                        {availabilityDays.map((day) => (
                          <section className="professional-availability-day" key={day.fecha}>
                            <h4>{day.label}</h4>
                            {day.slots.length === 0 ? (
                              <p>Sin horas disponibles</p>
                            ) : (
                              <div className="professional-slot-grid">
                                {day.slots.map((slot) => {
                                  const isSelected = selectedAvailabilitySlot?.inicio === slot.inicio;
                                  return (
                                    <button
                                      type="button"
                                      className={`professional-slot-chip ${isSelected ? 'is-selected' : ''}`}
                                      key={`${day.fecha}-${slot.inicio}`}
                                      onClick={() => setSelectedAvailabilitySlot({ ...slot, date: day.fecha, service: selectedService })}
                                    >
                                      {formatSlotTime(slot.inicio)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showBookingAction && (
                <aside className="professional-availability-summary">
                  <span className="modal-section-kicker">Resumen</span>
                  <div className="professional-summary-list">
                    <div>
                      <span>Servicio seleccionado</span>
                      <strong>{selectedServiceLabel || 'Selecciona un servicio'}</strong>
                    </div>
                    <div>
                      <span>Día y hora</span>
                      <strong>{selectedSlotLabel || 'Selecciona una hora disponible'}</strong>
                    </div>
                  </div>
                  <div className="professional-modal-actions">
                    {canLoadMoreAvailability && (
                      <button
                        type="button"
                        className="professional-availability-button"
                        onClick={() => setVisibleWorkDays((current) => Math.min(current + WORK_DAYS_INCREMENT, MAX_WORK_DAYS))}
                        disabled={availabilityLoading}
                      >
                        Ver más horarios
                      </button>
                    )}
                    {selectedAvailabilitySlot ? (
                      <Link
                        to="/reservar"
                        state={{
                          professional: professionalView,
                          service: selectedAvailabilitySlot.service,
                          selectedHour: selectedAvailabilitySlot.inicio,
                          selectedDate: selectedAvailabilitySlot.date,
                          availabilitySelection: {
                            idStaff: selectedStaffId,
                            idServicio: selectedServiceId,
                            fecha: selectedAvailabilitySlot.date,
                            horaInicio: selectedAvailabilitySlot.inicio,
                            duracionServicioMin: selectedAvailabilitySlot.duracionServicioMin,
                          },
                        }}
                        className="professional-modal-booking"
                        onClick={onClose}
                      >
                        <CalendarDays size={17} /> Reservar hora
                      </Link>
                    ) : (
                      <button type="button" className="professional-modal-booking is-disabled" disabled>
                        <CalendarDays size={17} /> Reservar hora
                      </button>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

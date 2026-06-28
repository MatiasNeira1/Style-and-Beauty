import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock, Image as ImageIcon, MapPin, Signal, Sparkles, X } from 'lucide-react';
import { SafeImage } from '../ui/SafeImage.jsx';
import { professionalTheme, statusTone } from '../../utils/professionalTheme.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { reservationService } from '../../services/reservationService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { STAFF_QUERY_OPTIONS, staffService } from '../../services/staffService.js';
import { addDays, filterBookableSlots, formatLocalDate, minBookingDate } from '../../utils/bookingDateRules.js';

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

function formatSlotDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function formatSlotTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
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
  const tone = statusTone(professionalView?.estado);
  const portfolio = useMemo(() => portfolioFor(professionalView), [professionalView]);
  const declaredServices = useMemo(() => servicesFor(professionalView), [professionalView]);
  const specialties = useMemo(() => specialtiesFor(professionalView), [professionalView]);
  const nextHour = professionalView?.proximaHora || professionalView?.proximasHoras?.[0] || '';
  const biography = professionalView?.biografiaProfesional || professionalView?.descripcionPerfil || professionalView?.descripcion || 'Atencion personalizada con diagnostico, tecnica cuidada y acabado profesional.';
  const curriculum = professionalView?.perfilCurricular || professionalView?.trayectoria || professionalView?.descripcionPerfil || `${professionalView?.fullName || 'El profesional'} combina tecnica, criterio estetico y una experiencia cercana para crear resultados pulidos y naturales.`;
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [availability, setAvailability] = useState({ status: 'idle', slots: [], error: '' });
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

  useEffect(() => {
    if (!professional) return;
    setAvailability({ status: 'idle', slots: [], error: '' });
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

  const consultAvailability = async () => {
    if (!serviceCatalogService.isValidUuid(selectedServiceId) || !reservationService.isValidUuid(selectedStaffId)) {
      setAvailability({ status: 'error', slots: [], error: 'Selecciona servicio y profesional para consultar disponibilidad.' });
      return;
    }

    setAvailability({ status: 'loading', slots: [], error: '' });
    try {
      const foundSlots = [];
      for (let offset = 0; offset < 14 && foundSlots.length < 6; offset += 1) {
        const date = formatLocalDate(addDays(minBookingDate(), offset));
        const slots = await reservationService.getAvailability({ idServicio: selectedServiceId, idStaff: selectedStaffId, fecha: date });
        filterBookableSlots(slots).forEach((slot) => {
          if (foundSlots.length < 6) foundSlots.push({ ...slot, date, service: selectedService });
        });
      }
      setAvailability({ status: 'success', slots: foundSlots, error: '' });
    } catch (error) {
      setAvailability({ status: 'error', slots: [], error: error?.message || 'No fue posible consultar disponibilidad.' });
    }
  };

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
                  <span className={`professional-modal-status ${tone}`}><Signal size={15} /> Estado: {professionalView.estado || 'Disponible hoy'}</span>
                  {nextHour ? (
                    <span><Clock size={15} /> Próxima hora: {nextHour}</span>
                  ) : (
                    <span><Clock size={15} /> Disponibilidad por consultar</span>
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
                <div className="professional-modal-services">
                  {specialties.map((specialty, index) => <span key={`specialty-${specialty}-${index}`}>{specialty}</span>)}
                  {servicesLoading && <span>Servicios activos en consulta</span>}
                  {!servicesLoading && services.map((service, index) => <span key={`service-${serviceId(service) || index}`}>{serviceName(service)}</span>)}
                  {!servicesLoading && services.length === 0 && <span>Sin servicios activos asociados</span>}
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

            <div className="professional-modal-footer">
              <div>
                <span className="modal-section-kicker">Disponibilidad real</span>
                <div className="professional-availability-controls">
                  {services.length > 1 && (
                    <label>
                      <span>Servicio</span>
                      <select value={selectedServiceId} onChange={(event) => {
                        setSelectedServiceId(event.target.value);
                        setAvailability({ status: 'idle', slots: [], error: '' });
                      }}>
                        {services.map((service) => (
                          <option key={serviceId(service)} value={serviceId(service)}>{serviceName(service)}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    type="button"
                    className="professional-availability-button"
                    onClick={consultAvailability}
                    disabled={availability.status === 'loading' || servicesLoading || services.length === 0 || servicesError}
                  >
                    {availability.status === 'loading' ? 'Consultando...' : 'Consultar disponibilidad'}
                  </button>
                </div>

                {servicesError && <p className="professional-availability-message is-error">No pudimos validar servicios activos asociados.</p>}
                {!servicesLoading && services.length === 0 && (
                  <p className="professional-availability-message">Este profesional no tiene servicios activos asociados para consultar agenda.</p>
                )}
                {availability.status === 'idle' && services.length > 0 && (
                  <p className="professional-availability-message">Selecciona un servicio y consulta próximos horarios reales.</p>
                )}
                {availability.status === 'error' && <p className="professional-availability-message is-error">{availability.error}</p>}
                {availability.status === 'success' && availability.slots.length === 0 && (
                  <p className="professional-availability-message">Sin horarios disponibles en los próximos días para este servicio.</p>
                )}
                {availability.slots.length > 0 && (
                  <div className="professional-modal-hours">
                    {availability.slots.map((slot) => (
                      <Link
                        key={`${slot.date}-${slot.inicio}`}
                        to="/reservar"
                        state={{
                          professional: professionalView,
                          service: slot.service,
                          selectedHour: slot.inicio,
                          selectedDate: slot.date,
                        }}
                        onClick={onClose}
                      >
                        <em>{formatSlotDate(slot.date)}</em>
                        <strong>{formatSlotTime(slot.inicio)}</strong>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {showBookingAction && (
                <Link to="/reservar" state={{ professional: professionalView }} className="professional-modal-booking" onClick={onClose}>
                  <CalendarDays size={17} /> Reservar hora
                </Link>
              )}
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

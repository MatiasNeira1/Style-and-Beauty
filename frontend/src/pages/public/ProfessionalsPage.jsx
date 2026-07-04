import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from '../../components/professionals/ProfessionalCard.jsx';
import { ProfessionalProfileModal } from '../../components/professionals/ProfessionalProfileModal.jsx';
import { ProfessionalSkeleton } from '../../components/professionals/ProfessionalsCarousel.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PremiumSelect } from '../../components/ui/PremiumSelect.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useProfessionals } from '../../hooks/useProfessionals.js';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { agendaService } from '../../services/agendaService.js';
import { serviceCatalogService } from '../../services/serviceCatalogService.js';
import { formatLocalDate, minBookingDate } from '../../utils/bookingDateRules.js';
import {
  assetFallback,
  assetPosition,
  preloadImageUrls,
  resolveVisualAssetImage,
  visualAssetsInitialLoading,
} from '../../utils/siteVisualAssets.js';

function unique(values) {
  const seen = new Map();
  values.filter(Boolean).forEach((value) => {
    const key = normalizeText(value);
    if (!seen.has(key)) seen.set(key, String(value).trim());
  });
  return ['Todos', ...Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'es'))];
}

function matches(value, filter) {
  return filter === 'Todos' || normalizeText(value) === normalizeText(filter);
}

const availabilityOptions = ['Todos', 'Disponible hoy', 'Mañana', 'Esta Semana', 'Hora más próxima'];
const branchOptions = [
  { label: 'Providencia', value: 'Providencia' },
  { label: 'Vitacura', value: 'Vitacura', disabled: true },
];

function normalizeText(value = '') {
  return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function staffId(professional) {
  return professional?.idStaff || professional?.idPersona || professional?.id || '';
}

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id || '';
}

function serviceName(service) {
  return service?.nombre || service?.nombreServicio || service?.name || service?.label || 'Servicio';
}

function isActiveService(service) {
  return service?.activo !== false;
}

function hasTomorrowSlot(professional) {
  return (professional.proximasHoras || []).some((hour) => normalizeText(hour).includes('manana'));
}

function hasAnySlot(professional) {
  return Boolean(professional.proximaHora || professional.proximasHoras?.length);
}

function matchesPublicAvailability(professional, filter) {
  if (filter === 'Todos') return true;
  if (filter === 'Disponible hoy') return hasAnySlot(professional) && !hasTomorrowSlot(professional);
  if (filter === 'Mañana') return hasTomorrowSlot(professional);
  if (filter === 'Esta Semana') return hasAnySlot(professional);
  if (filter === 'Hora más próxima') return hasAnySlot(professional);
  return true;
}

function availabilitySlots(availability) {
  return (availability?.dias || []).flatMap((day) => (
    Array.isArray(day?.horarios)
      ? day.horarios.map((slot) => ({ ...slot, fecha: day.fecha, label: day.label }))
      : []
  ));
}

function availabilityMatchesFilter(availability, filter) {
  if (filter === 'Todos') return true;
  if (!availability) return true;
  const slots = availabilitySlots(availability);
  if (filter === 'Disponible hoy') return slots.some((slot) => slot.fecha === formatLocalDate(minBookingDate()));
  if (filter === 'Mañana') return slots.some((slot) => slot.fecha === formatLocalDate(new Date(minBookingDate().getTime() + 24 * 60 * 60 * 1000)));
  if (filter === 'Esta Semana') return slots.length > 0;
  if (filter === 'Hora más próxima') return slots.length > 0;
  return true;
}

function slotWeight(professional) {
  const slot = normalizeText(professional.proximaHora || professional.proximasHoras?.[0] || '');
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return slot.includes('manana') ? minutes + 24 * 60 : minutes;
}

function availabilityWeight(availability) {
  const first = availabilitySlots(availability)
    .map((slot) => new Date(slot.inicio).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  return first || Number.MAX_SAFE_INTEGER;
}

function serviceBelongsToStaff(staffIdValue, rows = []) {
  const id = staffIdValue;
  return Array.isArray(rows) && rows.some((member) => staffId(member) === id);
}

function servicesFromEmbedded(professional, services) {
  const embedded = professional?.serviciosAsociados || professional?.servicios || professional?.services || [];
  if (!Array.isArray(embedded) || embedded.length === 0) return [];

  return embedded.map((item) => {
    if (typeof item === 'string') {
      return services.find((service) => serviceId(service) === item || normalizeText(serviceName(service)) === normalizeText(item));
    }
    const id = serviceId(item);
    return services.find((service) => serviceId(service) === id) || item;
  }).filter(Boolean).filter(isActiveService);
}

export function ProfessionalsPage() {
  const navigate = useNavigate();
  const { professionals, isLoading, isError, error } = useProfessionals();
  const visualAssetsQuery = useSiteVisualAssets();
  const professionalsHeroAsset = visualAssetsQuery.getAsset('professionals.hero');
  const visualAssetsLoading = visualAssetsInitialLoading(visualAssetsQuery);
  const professionalsHeroImage = useMemo(() => resolveVisualAssetImage({
    asset: professionalsHeroAsset,
    fallback: assetFallback('professionals.hero'),
    isLoading: visualAssetsLoading,
  }), [professionalsHeroAsset, visualAssetsLoading]);
  const allProfessionals = professionals;
  const gridRef = useRef(null);
  const [filters, setFilters] = useState({
    search: '',
    specialty: 'Todos',
    availability: 'Todos',
    branch: 'Todos',
  });
  const [filtersVersion, setFiltersVersion] = useState(0);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedSlotsByStaff, setSelectedSlotsByStaff] = useState({});
  const [bookingDraft, setBookingDraft] = useState(null);

  const filterOptions = useMemo(() => ({
    specialties: unique(allProfessionals.map((item) => item.especialidad)),
    branches: unique(allProfessionals.map((item) => item.sucursal)),
  }), [allProfessionals]);

  const baseFilteredProfessionals = useMemo(() => {
    const query = normalizeText(filters.search);
    const filtersAreClear = !query
      && filters.specialty === 'Todos'
      && filters.branch === 'Todos';

    if (filtersAreClear) return allProfessionals;

    const result = allProfessionals.filter((professional) => {
      const haystack = [
        professional.fullName,
        professional.especialidad,
        professional.cargo,
        professional.sucursal,
      ].map(normalizeText).join(' ');

      return (!query || haystack.includes(query))
        && matches(professional.especialidad, filters.specialty)
        && matches(professional.sucursal, filters.branch);
    });

    return result;
  }, [allProfessionals, filters.branch, filters.search, filters.specialty]);

  const staffIdsForAvailability = useMemo(() => (
    Array.from(new Set(
      baseFilteredProfessionals
        .map(staffId)
        .filter(agendaService.isValidUuid)
    ))
  ), [baseFilteredProfessionals]);

  const staffAvailabilityQuery = useQuery({
    queryKey: ['professionals-staff-upcoming-availability', staffIdsForAvailability.join(',')],
    queryFn: () => agendaService.consultarProximasDisponiblesStaffBatch({
      idsStaff: staffIdsForAvailability,
      fechaDesde: formatLocalDate(minBookingDate()),
      diasTrabajoRequeridos: 3,
      limiteDiasBusqueda: 21,
      zonaHoraria: 'America/Santiago',
    }),
    enabled: staffIdsForAvailability.length > 0 && !isLoading && !isError,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const availabilityByStaff = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(staffAvailabilityQuery.data?.resultados) ? staffAvailabilityQuery.data.resultados : [];
    rows.forEach((item) => {
      if (item?.idStaff) map.set(item.idStaff, item);
    });
    return map;
  }, [staffAvailabilityQuery.data]);

  const filteredProfessionals = useMemo(() => {
    const result = baseFilteredProfessionals.filter((professional) => {
      const id = staffId(professional);
      const availability = availabilityByStaff.get(id);
      return availabilityMatchesFilter(availability, filters.availability)
        || (!availabilityByStaff.has(id) && matchesPublicAvailability(professional, filters.availability));
    });

    if (filters.availability === 'Hora más próxima') {
      return [...result].sort((a, b) => {
        const weightA = availabilityWeight(availabilityByStaff.get(staffId(a)));
        const weightB = availabilityWeight(availabilityByStaff.get(staffId(b)));
        return weightA - weightB || slotWeight(a) - slotWeight(b);
      });
    }

    return result;
  }, [availabilityByStaff, baseFilteredProfessionals, filters.availability]);

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: serviceCatalogService.listServices,
    enabled: Boolean(bookingDraft),
    staleTime: 1000 * 60 * 5,
  });

  const activeServices = useMemo(() => (
    Array.isArray(servicesQuery.data) ? servicesQuery.data.filter(isActiveService) : []
  ), [servicesQuery.data]);

  const bookingStaffId = staffId(bookingDraft?.professional);
  const bookingServiceStaffQueries = useQueries({
    queries: activeServices.map((service) => {
      const id = serviceId(service);
      return {
        queryKey: ['service-staff', id],
        queryFn: () => serviceCatalogService.listProfessionalsByService(id),
        enabled: Boolean(bookingDraft && serviceCatalogService.isValidUuid(id)),
        staleTime: 1000 * 60 * 5,
      };
    }),
  });

  const bookingServices = useMemo(() => {
    const embedded = servicesFromEmbedded(bookingDraft?.professional, activeServices);
    if (embedded.length > 0) return embedded;

    return activeServices.filter((service, index) => (
      serviceBelongsToStaff(bookingStaffId, bookingServiceStaffQueries[index]?.data)
    ));
  }, [activeServices, bookingDraft?.professional, bookingServiceStaffQueries, bookingStaffId]);

  const bookingServicesLoading = servicesQuery.isLoading || bookingServiceStaffQueries.some((query) => query.isLoading || query.isFetching);
  const bookingServicesError = servicesQuery.isError || bookingServiceStaffQueries.some((query) => query.isError);

  useEffect(() => {
    preloadImageUrls([professionalsHeroImage.src]);
  }, [professionalsHeroImage.src]);

  const hasActiveFilters = filters.search || filters.specialty !== 'Todos' || filters.availability !== 'Todos' || filters.branch !== 'Todos';
  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const clearFilters = () => {
    setFilters({
      search: '',
      specialty: 'Todos',
      availability: 'Todos',
      branch: 'Todos',
    });
    setSelectedProfessional(null);
    setFiltersVersion((current) => current + 1);
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const selectCardSlot = (professional, slot) => {
    const id = staffId(professional);
    if (!id || !slot) return;
    setSelectedSlotsByStaff((current) => ({ ...current, [id]: slot }));
  };
  const openBookingServiceSelector = (professional, slot) => {
    setBookingDraft({ professional, slot });
  };
  const continueBooking = (service) => {
    if (!bookingDraft?.professional || !service) return;
    const slot = bookingDraft.slot;
    navigate('/reservar', {
      state: {
        professional: bookingDraft.professional,
        service,
        selectedDate: slot?.fecha || '',
        selectedHour: slot?.inicio || '',
        availabilitySelection: slot ? {
          idStaff: staffId(bookingDraft.professional),
          idServicio: serviceId(service),
          fecha: slot.fecha,
          horaInicio: slot.horaInicio,
        } : null,
      },
    });
  };

  return (
    <>
      <section
        className="page-hero page-hero-professionals"
        style={{ '--page-hero-position': assetPosition(professionalsHeroAsset, 'center 28%') }}
      >
        {professionalsHeroImage.isPending ? (
          <div className="page-hero-media page-hero-skeleton" aria-hidden="true" />
        ) : (
          <SafeImage
            src={professionalsHeroImage.src}
            fallback={assetFallback('professionals.hero')}
            alt=""
            aria-hidden="true"
            className="page-hero-media page-hero-image"
            loading="eager"
            fetchPriority="high"
            width={1024}
            height={1024}
          />
        )}
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Profesionales</span>
          <h1>Especialistas en belleza y bienestar</h1>
          <p>Elige a la profesional ideal para tu tratamiento, revisa disponibilidad y reserva tu próxima sesión.</p>
        </div>
      </section>

      <section className="page-section professionals-page">
        <SectionTitle eyebrow="Style & Beauty" title="Profesionales a tu servicio">
          Busca por nombre, especialidad, cargo o sucursal y reserva desde una vista rapida.
        </SectionTitle>

        <div className="professionals-toolbar">
          <label className="professional-search">
            <Search size={18} />
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Buscar por nombre, especialidad o sucursal..."
            />
          </label>

          <div className="professionals-filter-grid">
            <PremiumSelect
              key={`specialty-${filtersVersion}`}
              id="filter-specialty"
              label="Especialidad"
              value={filters.specialty}
              options={filterOptions.specialties}
              onChange={(value) => updateFilter('specialty', value)}
            />
            <PremiumSelect
              key={`availability-${filtersVersion}`}
              id="filter-availability"
              label="Disponibilidad"
              value={filters.availability}
              options={availabilityOptions}
              onChange={(value) => updateFilter('availability', value)}
            />
            <PremiumSelect
              key={`branch-${filtersVersion}`}
              id="filter-branch"
              label="Sucursal"
              value={filters.branch}
              options={filterOptions.branches.length > 1 ? filterOptions.branches : unique(branchOptions.map((option) => option.value))}
              onChange={(value) => updateFilter('branch', value)}
            />
          </div>
          {hasActiveFilters && (
            <button type="button" className="admin-text-button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div ref={gridRef} />

        {isLoading ? (
          <div className="professionals-grid">
            {[0, 1, 2, 3, 4, 5].map((item) => <ProfessionalSkeleton key={item} />)}
          </div>
        ) : isError ? (
          <div className="professionals-empty-state">
            <SlidersHorizontal size={34} />
            <h3>No fue posible cargar profesionales.</h3>
            <p>{error?.message || 'Servicio temporalmente no disponible.'}</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="professionals-empty-state">
            <SlidersHorizontal size={34} />
            <h3>No encontramos especialistas con esos filtros</h3>
            <p>Prueba ajustando especialidad, disponibilidad o sucursal.</p>
          </div>
        ) : (
          <motion.div className="professionals-grid" initial={false} animate="visible">
            {filteredProfessionals.map((professional, index) => (
              <motion.div
                key={professional.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
              >
                <ProfessionalCard
                  professional={professional}
                  onViewProfile={setSelectedProfessional}
                  availability={availabilityByStaff.get(staffId(professional))}
                  availabilityLoading={staffAvailabilityQuery.isLoading || staffAvailabilityQuery.isFetching}
                  availabilityError={staffAvailabilityQuery.isError}
                  selectedSlot={selectedSlotsByStaff[staffId(professional)]}
                  onSelectAvailabilitySlot={selectCardSlot}
                  onReserve={openBookingServiceSelector}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="professionals-calendar-note">
          <Sparkles size={18} />
          <span>Las horas visibles corresponden a proximos espacios de reserva por especialista y cabina.</span>
        </div>
      </section>

      <ProfessionalProfileModal professional={selectedProfessional} onClose={() => setSelectedProfessional(null)} />

      <Modal
        open={Boolean(bookingDraft)}
        title={`Reservar con ${bookingDraft?.professional?.fullName || 'profesional'}`}
        onClose={() => setBookingDraft(null)}
        className="professional-service-reservation-modal"
      >
        <div className="professional-service-reservation">
          <div className="professional-selected-slot">
            <span>Horario seleccionado</span>
            <strong>
              {bookingDraft?.slot
                ? `${bookingDraft.slot.label} · ${bookingDraft.slot.horaInicio}`
                : 'Sin horario seleccionado'}
            </strong>
            {!bookingDraft?.slot && <p>Al continuar, la reserva buscará la primera hora disponible para el servicio elegido.</p>}
          </div>

          <div className="professional-service-reservation-heading">
            <span>Selecciona un servicio</span>
            <p>Solo se muestran servicios asociados a este profesional.</p>
          </div>

          {bookingServicesLoading ? (
            <p className="professional-availability-message">Consultando servicios disponibles...</p>
          ) : bookingServicesError ? (
            <p className="professional-availability-message is-error">No pudimos consultar servicios para este profesional.</p>
          ) : bookingServices.length === 0 ? (
            <p className="professional-availability-message">Este profesional aún no tiene servicios asociados.</p>
          ) : (
            <div className="professional-service-reservation-list">
              {bookingServices.map((service) => (
                <button
                  type="button"
                  key={serviceId(service) || serviceName(service)}
                  onClick={() => continueBooking(service)}
                >
                  {serviceName(service)}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

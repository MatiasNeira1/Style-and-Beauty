import { useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from '../../components/professionals/ProfessionalCard.jsx';
import { ProfessionalProfileModal } from '../../components/professionals/ProfessionalProfileModal.jsx';
import { ProfessionalSkeleton } from '../../components/professionals/ProfessionalsCarousel.jsx';
import { PremiumSelect } from '../../components/ui/PremiumSelect.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useProfessionals } from '../../hooks/useProfessionals.js';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { assetFallback, heroImageStyle } from '../../utils/siteVisualAssets.js';

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

function slotWeight(professional) {
  const slot = normalizeText(professional.proximaHora || professional.proximasHoras?.[0] || '');
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return slot.includes('manana') ? minutes + 24 * 60 : minutes;
}

export function ProfessionalsPage() {
  const { professionals, isLoading, isError, error } = useProfessionals();
  const visualAssetsQuery = useSiteVisualAssets();
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

  const filterOptions = useMemo(() => ({
    specialties: unique(allProfessionals.map((item) => item.especialidad)),
    branches: unique(allProfessionals.map((item) => item.sucursal)),
  }), [allProfessionals]);

  const filteredProfessionals = useMemo(() => {
    const query = normalizeText(filters.search);
    const filtersAreClear = !query
      && filters.specialty === 'Todos'
      && filters.availability === 'Todos'
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
        && matchesPublicAvailability(professional, filters.availability)
        && matches(professional.sucursal, filters.branch);
    });

    if (filters.availability === 'Hora más próxima') {
      return [...result].sort((a, b) => slotWeight(a) - slotWeight(b));
    }

    return result;
  }, [allProfessionals, filters]);

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

  return (
    <>
      <section
        className="page-hero page-hero-professionals"
        style={heroImageStyle(visualAssetsQuery.getAsset('professionals.hero'), assetFallback('professionals.hero'), 'center 28%')}
      >
        <div className="page-hero-media" />
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
                <ProfessionalCard professional={professional} onViewProfile={setSelectedProfessional} />
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
    </>
  );
}

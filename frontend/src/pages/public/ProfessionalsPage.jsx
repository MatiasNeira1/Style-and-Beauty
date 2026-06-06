import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from '../../components/professionals/ProfessionalCard.jsx';
import { ProfessionalProfileModal } from '../../components/professionals/ProfessionalProfileModal.jsx';
import { ProfessionalSkeleton } from '../../components/professionals/ProfessionalsCarousel.jsx';
import { PremiumSelect } from '../../components/ui/PremiumSelect.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useProfessionals } from '../../hooks/useProfessionals.js';

function unique(values) {
  return ['Todos', ...Array.from(new Set(values.filter(Boolean)))];
}

function matches(value, filter) {
  return filter === 'Todos' || value === filter;
}

const availabilityOptions = ['Todos', 'Disponible hoy', 'Mañana', 'Esta Semana', 'Hora más próxima'];
const branchOptions = [
  { label: 'Providencia', value: 'Providencia' },
  { label: 'Vitacura', value: 'Vitacura', disabled: true },
];

function normalizeText(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('Todos');
  const [availability, setAvailability] = useState('Todos');
  const [branch, setBranch] = useState('Providencia');
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  const filters = useMemo(() => ({
    specialties: unique(professionals.map((item) => item.especialidad)),
  }), [professionals]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = professionals.filter((professional) => {
      const haystack = [
        professional.fullName,
        professional.especialidad,
        professional.cargo,
        professional.sucursal,
      ].join(' ').toLowerCase();

      return (!query || haystack.includes(query))
        && matches(professional.especialidad, specialty)
        && matchesPublicAvailability(professional, availability)
        && matches(professional.sucursal, branch);
    });

    if (availability === 'Hora más próxima') {
      return [...result].sort((a, b) => slotWeight(a) - slotWeight(b));
    }

    return result;
  }, [professionals, search, specialty, availability, branch]);

  return (
    <>
      <section className="page-hero page-hero-professionals">
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, especialidad o sucursal..." />
          </label>

          <div className="professionals-filter-grid">
            <PremiumSelect id="filter-specialty" label="Especialidad" value={specialty} options={filters.specialties} onChange={setSpecialty} />
            <PremiumSelect id="filter-availability" label="Disponibilidad" value={availability} options={availabilityOptions} onChange={setAvailability} />
            <PremiumSelect id="filter-branch" label="Sucursal" value={branch} options={branchOptions} onChange={setBranch} />
          </div>
        </div>

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
        ) : filtered.length === 0 ? (
          <div className="professionals-empty-state">
            <SlidersHorizontal size={34} />
            <h3>No encontramos especialistas con esos filtros</h3>
            <p>Prueba ajustando especialidad, disponibilidad o sucursal.</p>
          </div>
        ) : (
          <motion.div className="professionals-grid" initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
            {filtered.map((professional, index) => (
              <motion.div
                key={professional.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
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

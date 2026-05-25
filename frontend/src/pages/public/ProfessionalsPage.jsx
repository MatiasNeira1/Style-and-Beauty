import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfessionalCard } from '../../components/professionals/ProfessionalCard.jsx';
import { ProfessionalSkeleton } from '../../components/professionals/ProfessionalsCarousel.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useProfessionals } from '../../hooks/useProfessionals.js';

function unique(values) {
  return ['Todos', ...Array.from(new Set(values.filter(Boolean)))];
}

function matches(value, filter) {
  return filter === 'Todos' || value === filter;
}

export function ProfessionalsPage() {
  const { professionals, isLoading } = useProfessionals();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('Todos');
  const [availability, setAvailability] = useState('Todos');
  const [branch, setBranch] = useState('Todos');

  const filters = useMemo(() => ({
    specialties: unique(professionals.map((item) => item.especialidad)),
    availability: unique(professionals.map((item) => item.estado)),
    branches: unique(professionals.map((item) => item.sucursal)),
  }), [professionals]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return professionals.filter((professional) => {
      const haystack = [
        professional.fullName,
        professional.especialidad,
        professional.cargo,
        professional.sucursal,
      ].join(' ').toLowerCase();

      return (!query || haystack.includes(query))
        && matches(professional.especialidad, specialty)
        && matches(professional.estado, availability)
        && matches(professional.sucursal, branch);
    });
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
            <Input as="select" id="filter-specialty" label="Especialidad" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
              {filters.specialties.map((item) => <option key={item}>{item}</option>)}
            </Input>
            <Input as="select" id="filter-availability" label="Disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)}>
              {filters.availability.map((item) => <option key={item}>{item}</option>)}
            </Input>
            <Input as="select" id="filter-branch" label="Sucursal" value={branch} onChange={(event) => setBranch(event.target.value)}>
              {filters.branches.map((item) => <option key={item}>{item}</option>)}
            </Input>
          </div>
        </div>

        {isLoading ? (
          <div className="professionals-grid">
            {[0, 1, 2, 3, 4, 5].map((item) => <ProfessionalSkeleton key={item} />)}
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
                <ProfessionalCard professional={professional} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="professionals-calendar-note">
          <Sparkles size={18} />
          <span>Las horas visibles corresponden a proximos espacios de reserva por especialista y cabina.</span>
        </div>
      </section>
    </>
  );
}

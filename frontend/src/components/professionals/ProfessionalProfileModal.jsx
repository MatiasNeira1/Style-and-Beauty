import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Image as ImageIcon, MapPin, Signal, Sparkles, X } from 'lucide-react';
import { SafeImage } from '../ui/SafeImage.jsx';
import { professionalTheme, statusTone } from '../../utils/professionalTheme.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';

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

function servicesFor(professional) {
  const assignedServices = professional?.serviciosAsociados || professional?.servicios || professional?.services || [];
  const normalizedServices = Array.isArray(assignedServices)
    ? assignedServices.map(serviceName).filter(Boolean)
    : [];

  if (normalizedServices.length > 0) {
    return normalizedServices;
  }

  const text = normalize(`${professional?.especialidad || ''} ${professional?.descripcion || ''}`);
  if (text.includes('maquill')) return ['Maquillaje social', 'Maquillaje de novia', 'Preparación de piel'];
  if (text.includes('manicur') || text.includes('nail')) return ['Manicure premium', 'Esmaltado permanente', 'Nail art'];
  if (text.includes('capilar') || text.includes('color') || text.includes('estilista')) return ['Corte y brushing', 'Coloración', 'Tratamientos capilares'];
  if (text.includes('maso')) return ['Masaje relajante', 'Drenaje', 'Ritual spa'];
  if (text.includes('corporal') || text.includes('kines')) return ['Drenaje linfático', 'Modelación corporal', 'Tratamientos reafirmantes'];
  return ['Limpieza facial', 'Hidratación profunda', 'Glow facial'];
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

function isBookableHour(value) {
  return /^\d{1,2}:\d{2}$/.test(String(value || '').trim());
}

export function ProfessionalProfileModal({ professional, onClose }) {
  const theme = professionalTheme(professional?.especialidad);
  const tone = statusTone(professional?.estado);
  const portfolio = useMemo(() => portfolioFor(professional), [professional]);
  const services = useMemo(() => servicesFor(professional), [professional]);
  const specialties = useMemo(() => specialtiesFor(professional), [professional]);
  const nextHour = professional?.proximaHora || professional?.proximasHoras?.[0] || 'Consultar disponibilidad';
  const biography = professional?.biografiaProfesional || professional?.descripcionPerfil || professional?.descripcion || 'Atencion personalizada con diagnostico, tecnica cuidada y acabado profesional.';
  const curriculum = professional?.perfilCurricular || professional?.trayectoria || professional?.descripcionPerfil || `${professional?.fullName || 'El profesional'} combina tecnica, criterio estetico y una experiencia cercana para crear resultados pulidos y naturales.`;
  const publicHours = professional?.horariosPublicos || professional?.jornadasPublicas || [];
  const displayedHours = Array.isArray(publicHours) && publicHours.length
    ? publicHours
    : (professional?.proximasHoras?.length ? professional.proximasHoras : ['Consultar disponibilidad']);
  const hasPortfolio = portfolio.length > 0;
  useBodyScrollLock(Boolean(professional));

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
            style={{ '--specialty-color': professional.colorEspecialidad || theme.color, '--specialty-soft': theme.soft }}
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
                <SafeImage src={professional.imageUrl || professional.fotoUrl} alt={professional.fullName} fallback="/logo.jpg" />
              </div>
              <div className="professional-modal-intro">
                <span className="professional-specialty"><Sparkles size={14} /> {professional.especialidad || professional.cargo}</span>
                <h2 id="professional-profile-title">{professional.fullName}</h2>
                <p>{biography}</p>
                <div className="professional-modal-meta">
                  <span><MapPin size={15} /> Sucursal: {professional.sucursal || 'Providencia'}</span>
                  <span className={`professional-modal-status ${tone}`}><Signal size={15} /> Estado: {professional.estado || 'Disponible hoy'}</span>
                  <span><Clock size={15} /> Próxima hora: {nextHour}</span>
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
                  <strong>{yearsWithUs(professional)}</strong>
                  <span>Experiencia curada para clientas que buscan precision, calma y resultados consistentes.</span>
                </div>
              </section>

              <section>
                <span className="modal-section-kicker">Servicios</span>
                <h3>Especialidades y servicios</h3>
                <div className="professional-modal-services">
                  {specialties.map((specialty, index) => <span key={`specialty-${specialty}-${index}`}>{specialty}</span>)}
                  {services.map((service, index) => <span key={`service-${service}-${index}`}>{service}</span>)}
                </div>
              </section>
            </div>

            <section className="professional-modal-gallery" aria-label="Galería de trabajos realizados">
              {hasPortfolio ? (
                portfolio.map((image, index) => (
                  <SafeImage
                    key={image || `portfolio-${index}`}
                    src={image}
                    alt={`Trabajo realizado ${index + 1} por ${professional.fullName}`}
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
                <span className="modal-section-kicker">Horarios disponibles</span>
                <div className="professional-modal-hours">
                  {displayedHours.map((hour) => {
                    const todayStr = new Date().toLocaleDateString('sv-SE');
                    return isBookableHour(hour) ? (
                      <Link
                        key={hour}
                        to="/reservar"
                        state={{
                          professional,
                          selectedHour: `${todayStr}T${hour}:00`,
                          selectedDate: todayStr
                        }}
                        onClick={onClose}
                      >
                        {hour}
                      </Link>
                    ) : (
                      <span key={hour}>{hour}</span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

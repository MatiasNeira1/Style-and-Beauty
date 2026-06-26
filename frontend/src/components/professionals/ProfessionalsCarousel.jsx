import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProfessionalCard } from './ProfessionalCard.jsx';

function slidesForViewport() {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth >= 1440) return 5;
  if (window.innerWidth >= 1180) return 4;
  if (window.innerWidth >= 720) return 2;
  return 1;
}

export function ProfessionalsCarousel({ professionals = [], isLoading = false }) {
  const [page, setPage] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(slidesForViewport);
  const pageCount = Math.max(1, Math.ceil(professionals.length / slidesPerView));

  useEffect(() => {
    const handleResize = () => setSlidesPerView(slidesForViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1 || isLoading) return undefined;
    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % pageCount);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isLoading, pageCount]);

  const visible = useMemo(() => {
    if (!professionals.length) return [];
    const start = page * slidesPerView;
    return professionals.slice(start, start + slidesPerView);
  }, [professionals, page, slidesPerView]);

  const next = () => setPage((current) => (current + 1) % pageCount);
  const prev = () => setPage((current) => (current - 1 + pageCount) % pageCount);
  const handleDragEnd = (_, info) => {
    if (pageCount <= 1) return;
    const swipeOffset = info.offset.x;
    const swipeVelocity = info.velocity.x;
    if (swipeOffset < -45 || swipeVelocity < -350) next();
    if (swipeOffset > 45 || swipeVelocity > 350) prev();
  };
  const visibleDots = useMemo(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index);
    const start = Math.min(Math.max(page - 3, 0), pageCount - 7);
    return Array.from({ length: 7 }, (_, index) => start + index);
  }, [page, pageCount]);

  return (
    <section className="professionals-dashboard-module">
      <div className="professionals-module-header">
        <div>
          <span className="card-kicker"><Sparkles size={14} /> Style &amp; Beauty</span>
          <h2>Nuestro equipo de especialistas</h2>
          <p>Conoce a quienes cuidan cada tratamiento, sesión y experiencia de bienestar.</p>
        </div>
        <div className="carousel-controls">
          <button type="button" className="icon-link" onClick={prev} disabled={pageCount <= 1} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-link" onClick={next} disabled={pageCount <= 1} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="professionals-carousel-grid" style={{ gridTemplateColumns: `repeat(${slidesPerView}, minmax(0, 1fr))` }}>
          {Array.from({ length: slidesPerView }).map((_, item) => <ProfessionalSkeleton key={item} />)}
        </div>
      ) : professionals.length === 0 ? (
        <div className="professionals-empty-state">
          <Sparkles size={32} />
          <h3>No hay profesionales registrados</h3>
          <p>Cuando se registren especialistas apareceran en este carrusel.</p>
        </div>
      ) : (
        <div className="professionals-carousel-shell">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              className="professionals-carousel-grid"
              style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
              drag={pageCount > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              whileTap={pageCount > 1 ? { cursor: 'grabbing' } : undefined}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              {visible.map((professional) => (
                <ProfessionalCard key={professional.id} professional={professional} compact />
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="carousel-dots" aria-label="Paginacion del carrusel">
            {visibleDots.map((index) => (
              <button
                key={index}
                type="button"
                className={`carousel-dot ${index === page ? 'active' : ''}`}
                onClick={() => setPage(index)}
                aria-label={`Ir al slide ${index + 1}`}
                aria-current={index === page}
              />
            ))}
            {pageCount > 7 && <span className="carousel-counter">{page + 1}/{pageCount}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

export function ProfessionalSkeleton() {
  return (
    <div className="professional-card professional-skeleton">
      <div className="skeleton-line media" />
      <div className="skeleton-line title" />
      <div className="skeleton-line text" />
      <div className="skeleton-line text short" />
    </div>
  );
}

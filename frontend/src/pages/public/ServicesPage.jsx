import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ServicesByCategory } from '../../components/services/ServicesByCategory.jsx';
import { ServicesCategories } from '../../components/services/ServicesCategories.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { mockServices, serviceCategories } from '../../mocks/services.mock.js';

export function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = useMemo(() => {
    const selectedId = searchParams.get('categoria');
    return serviceCategories.find((category) => category.id === selectedId) || null;
  }, [searchParams]);
  const visibleServices = useMemo(() => (
    selectedCategory ? mockServices.filter((service) => service.categoriaId === selectedCategory.id) : []
  ), [selectedCategory]);
  const heroTitle = selectedCategory?.heroTitle || 'Servicios de belleza y bienestar';
  const heroSubtitle = selectedCategory?.heroSubtitle || 'Elige una especialidad y descubre nuestros tratamientos.';

  return (
    <>
      <section className="page-hero page-hero-services">
        <div className="page-hero-media" />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Catálogo</span>
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
        </div>
      </section>

      <section className="page-section catalog-page">
        {!selectedCategory ? (
          <>
            <SectionTitle eyebrow="Categorías" title="Elige tu experiencia">
              Primero selecciona una categoría para revisar los servicios disponibles.
            </SectionTitle>
            <Reveal>
              <ServicesCategories
                categories={serviceCategories}
                services={mockServices}
                onSelect={(category) => setSearchParams({ categoria: category.id })}
              />
            </Reveal>
          </>
        ) : (
          <Reveal>
            <ServicesByCategory category={selectedCategory} services={visibleServices} onBack={() => setSearchParams({})} />
          </Reveal>
        )}
      </section>
    </>
  );
}

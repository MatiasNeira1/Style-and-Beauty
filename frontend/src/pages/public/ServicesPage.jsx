import { useQuery } from '@tanstack/react-query';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { CategoryGrid } from '../../components/services/CategoryGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { catalogService } from '../../services/catalogService.js';

export function ServicesPage() {
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];

  return (
    <>
      <section className="page-hero page-hero-services">
        <div className="page-hero-media" />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Catalogo</span>
          <h1>Servicios de belleza y bienestar</h1>
          <p>Elige una especialidad y descubre nuestros tratamientos.</p>
        </div>
      </section>

      <section className="page-section catalog-page">
        <SectionTitle eyebrow="Categorias" title="Elige tu experiencia">
          Primero selecciona una categoria para revisar los servicios disponibles.
        </SectionTitle>
        {servicesQuery.isLoading ? (
          <Loader />
        ) : servicesQuery.isError ? (
          <p className="admin-alert">{servicesQuery.error.message}</p>
        ) : services.length === 0 ? (
          <p className="admin-alert">No hay servicios cargados en el catalogo.</p>
        ) : (
          <Reveal>
            <CategoryGrid services={services} />
          </Reveal>
        )}
      </section>
    </>
  );
}

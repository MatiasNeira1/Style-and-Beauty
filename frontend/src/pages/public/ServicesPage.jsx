import { useQuery } from '@tanstack/react-query';
import { CategoryGrid } from '../../components/services/CategoryGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { catalogService } from '../../services/catalogService.js';
import { assetFallback, assetImage, assetPosition } from '../../utils/siteVisualAssets.js';

export function ServicesPage() {
  const visualAssetsQuery = useSiteVisualAssets();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const categoryCoversQuery = useQuery({ queryKey: ['service-category-covers'], queryFn: catalogService.getCategoryCovers });
  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const categoryCovers = Array.isArray(categoryCoversQuery.data) ? categoryCoversQuery.data : [];
  const servicesHeroAsset = visualAssetsQuery.getAsset('services.hero');

  return (
    <>
      <section
        className="page-hero page-hero-services"
        style={{ '--page-hero-position': assetPosition(servicesHeroAsset, 'center 42%') }}
      >
        <SafeImage
          src={assetImage(servicesHeroAsset, assetFallback('services.hero'))}
          fallback={assetFallback('services.hero')}
          alt=""
          aria-hidden="true"
          className="page-hero-media page-hero-image"
          loading="eager"
          fetchPriority="high"
          width={1024}
          height={1024}
        />
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
          <CategoryGrid services={services} categoryCovers={categoryCovers} visualAssetsByKey={visualAssetsQuery.assetsByKey} />
        )}
      </section>
    </>
  );
}

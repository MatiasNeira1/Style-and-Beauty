import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryGrid } from '../../components/services/CategoryGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { catalogService } from '../../services/catalogService.js';
import { categorySlug, groupByCategory } from '../../utils/categoryUtils.js';
import {
  assetFallback,
  assetPosition,
  hasActiveAssetImage,
  preloadImageUrls,
  resolveVisualAssetImage,
  serviceCategoryAssetKey,
  visualAssetsInitialLoading,
} from '../../utils/siteVisualAssets.js';

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl || '';
}

export function ServicesPage() {
  const visualAssetsQuery = useSiteVisualAssets();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const categoryCoversQuery = useQuery({ queryKey: ['service-category-covers'], queryFn: catalogService.getCategoryCovers });
  const services = useMemo(() => (Array.isArray(servicesQuery.data) ? servicesQuery.data : []), [servicesQuery.data]);
  const categoryCovers = useMemo(
    () => (Array.isArray(categoryCoversQuery.data) ? categoryCoversQuery.data : []),
    [categoryCoversQuery.data],
  );
  const servicesHeroAsset = visualAssetsQuery.getAsset('services.hero');
  const visualAssetsLoading = visualAssetsInitialLoading(visualAssetsQuery);
  const categoryCoversLoading = categoryCoversQuery.isLoading && categoryCovers.length === 0;
  const servicesHeroImage = useMemo(() => resolveVisualAssetImage({
    asset: servicesHeroAsset,
    fallback: assetFallback('services.hero'),
    isLoading: visualAssetsLoading,
  }), [servicesHeroAsset, visualAssetsLoading]);
  const categoryPreloadUrls = useMemo(() => {
    if (servicesQuery.isLoading || visualAssetsLoading || categoryCoversLoading) return [];

    const coversByCategory = categoryCovers.reduce((acc, cover) => {
      if (cover?.categoria && cover?.imagenUrl) acc[categorySlug(cover.categoria)] = cover.imagenUrl;
      return acc;
    }, {});

    return Object.entries(groupByCategory(services))
      .map(([category, categoryServices]) => {
        const assetKey = serviceCategoryAssetKey(category);
        const asset = assetKey ? visualAssetsQuery.assetsByKey[assetKey] : null;
        const resolved = resolveVisualAssetImage({
          asset,
          imageUrl: coversByCategory[categorySlug(category)] || serviceImage(categoryServices[0]),
          fallback: assetFallback(assetKey || 'services.hero'),
          isLoading: !hasActiveAssetImage(asset) && (visualAssetsLoading || categoryCoversLoading),
        });
        return resolved.src;
      })
      .filter(Boolean);
  }, [
    categoryCovers,
    categoryCoversLoading,
    services,
    servicesQuery.isLoading,
    visualAssetsLoading,
    visualAssetsQuery.assetsByKey,
  ]);

  useEffect(() => {
    preloadImageUrls([servicesHeroImage.src, ...categoryPreloadUrls]);
  }, [categoryPreloadUrls, servicesHeroImage.src]);

  return (
    <>
      <section
        className="page-hero page-hero-services"
        style={{ '--page-hero-position': assetPosition(servicesHeroAsset, 'center 42%') }}
      >
        {servicesHeroImage.isPending ? (
          <div className="page-hero-media page-hero-skeleton" aria-hidden="true" />
        ) : (
          <SafeImage
            src={servicesHeroImage.src}
            fallback={assetFallback('services.hero')}
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
          <CategoryGrid
            services={services}
            categoryCovers={categoryCovers}
            visualAssetsByKey={visualAssetsQuery.assetsByKey}
            visualAssetsLoading={visualAssetsLoading}
            categoryCoversLoading={categoryCoversLoading}
          />
        )}
      </section>
    </>
  );
}

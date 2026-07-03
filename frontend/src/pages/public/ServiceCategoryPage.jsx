import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { BalancedGrid } from '../../components/ui/BalancedGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { SafeImage } from '../../components/ui/SafeImage.jsx';
import { useSiteVisualAssets } from '../../hooks/useSiteVisualAssets.js';
import { catalogService } from '../../services/catalogService.js';
import { categorySlug, findCategoryBySlug, groupByCategory } from '../../utils/categoryUtils.js';
import { formatCLP } from '../../utils/priceUtils.js';
import { assetFallback, assetImage, assetPosition, serviceCategoryAssetKey } from '../../utils/siteVisualAssets.js';

function servicePrice(service) {
  const value = service.precio_total ?? service.precio ?? service.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return formatCLP(value);
}

function serviceImage(service) {
  return service?.imagenUrl || service?.imageUrl || service?.imagen_url || service?.imagen || service?.fotoUrl || '';
}

export function ServiceCategoryPage() {
  const { categoria } = useParams();
  const visualAssetsQuery = useSiteVisualAssets();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const categoryCoversQuery = useQuery({ queryKey: ['service-category-covers'], queryFn: catalogService.getCategoryCovers });

  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const grouped = groupByCategory(services);
  const categories = Object.keys(grouped);
  const category = findCategoryBySlug(categories, categoria) || categories[0] || 'General';
  const categoryServices = grouped[category] || [];
  const categoryCovers = Array.isArray(categoryCoversQuery.data) ? categoryCoversQuery.data : [];
  const categoryCoverUrl = categoryCovers.find((cover) => categorySlug(cover?.categoria) === categorySlug(category))?.imagenUrl || '';
  const categoryAssetKey = serviceCategoryAssetKey(category);
  const categoryAsset = categoryAssetKey ? visualAssetsQuery.getAsset(categoryAssetKey) : null;
  const categoryHeroImage = assetImage(categoryAsset, categoryCoverUrl || assetFallback(categoryAssetKey || 'services.hero'));

  return (
    <>
      <section
        className="page-hero page-hero-services page-hero-category"
        style={{ '--page-hero-position': assetPosition(categoryAsset, 'center') }}
      >
        <SafeImage
          src={categoryHeroImage}
          fallback="/hero-salon.png"
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
          <span className="card-kicker">Categoria</span>
          <h1>{category}</h1>
          <p>Servicios compactos, precios claros y acceso rapido a especialistas disponibles.</p>
        </div>
      </section>

      <section className="page-section catalog-page service-category-page">
        <Link className="text-link service-back-link" to="/servicios">
          <ArrowLeft size={16} />
          Categorias
        </Link>

        <SectionTitle eyebrow="Servicios" title="Elige tu tratamiento">
          Revisa descripcion, precio y duracion antes de entrar al detalle.
        </SectionTitle>

        {servicesQuery.isLoading ? (
          <Loader />
        ) : servicesQuery.isError ? (
          <p className="admin-alert">{servicesQuery.error.message}</p>
        ) : categoryServices.length === 0 ? (
          <p className="admin-alert">No hay servicios cargados para esta categoria.</p>
        ) : (
          <div className="category-detail-layout">
            <BalancedGrid className="category-service-list">
              {categoryServices.map((service) => (
                <Link
                  key={service.id_servicio || service.idServicio || service.id || service.nombre}
                  className="category-service-card category-service-link"
                  to={`/servicios/${categorySlug(category)}/${categorySlug(service.nombre || service.name || service.id_servicio || service.idServicio || service.id)}`}
                >
                  <div className="category-service-heading">
                    <div className="category-service-thumbnail">
                      {serviceImage(service) ? (
                        <SafeImage
                          src={serviceImage(service)}
                          alt={service.nombre || service.name || 'Servicio'}
                          loading="eager"
                          width={160}
                          height={160}
                        />
                      ) : (
                        <span aria-hidden="true">{String(service.nombre || service.name || 'S').slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <span className="card-kicker">{category}</span>
                      <h3>{service.nombre || service.name}</h3>
                    </div>
                  </div>
                  <p>{service.descripcion || service.description || 'Atencion personalizada con acabado profesional.'}</p>
                  <div className="category-service-meta">
                    <strong>{servicePrice(service)}</strong>
                    <span><Clock size={14} /> {service.duracion_minutos || service.duracion || 45} min</span>
                  </div>
                  <span className="service-open-link">
                    Ver detalle <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </BalancedGrid>
          </div>
        )}
      </section>
    </>
  );
}

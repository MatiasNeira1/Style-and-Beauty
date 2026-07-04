import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BalancedGrid } from '../ui/BalancedGrid.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { categorySlug, groupByCategory } from '../../utils/categoryUtils.js';
import {
  assetFallback,
  assetPosition,
  hasActiveAssetImage,
  resolveVisualAssetImage,
  serviceCategoryAssetKey,
} from '../../utils/siteVisualAssets.js';

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl;
}

export const CategoryGrid = memo(function CategoryGrid({
  services = [],
  categoryCovers = [],
  visualAssetsByKey = {},
  visualAssetsLoading = false,
  categoryCoversLoading = false,
}) {
  const categories = useMemo(() => Object.entries(groupByCategory(services)), [services]);
  const coversByCategory = useMemo(() => categoryCovers.reduce((acc, cover) => {
    if (cover?.categoria && cover?.imagenUrl) acc[categorySlug(cover.categoria)] = cover.imagenUrl;
    return acc;
  }, {}), [categoryCovers]);

  const resolvedCategories = useMemo(() => categories.map(([category, categoryServices]) => {
    const sample = categoryServices[0];
    const assetKey = serviceCategoryAssetKey(category);
    const visualAsset = assetKey ? visualAssetsByKey[assetKey] : null;
    const coverUrl = coversByCategory[categorySlug(category)] || '';
    const waitForAdminOrCover = !hasActiveAssetImage(visualAsset) && (visualAssetsLoading || categoryCoversLoading);
    const resolvedImage = resolveVisualAssetImage({
      asset: visualAsset,
      imageUrl: coverUrl || serviceImage(sample),
      fallback: assetFallback(assetKey || 'services.hero'),
      isLoading: waitForAdminOrCover,
    });

    return {
      category,
      categoryServices,
      sample,
      imageUrl: resolvedImage.src,
      imagePending: resolvedImage.isPending,
      objectPosition: assetPosition(visualAsset, 'center'),
    };
  }), [categories, categoryCoversLoading, coversByCategory, visualAssetsByKey, visualAssetsLoading]);

  return (
    <BalancedGrid className="category-grid public-category-grid">
      {resolvedCategories.map(({ category, categoryServices, sample, imageUrl, imagePending, objectPosition }) => {
        return (
          <Link key={category} className="category-card" to={`/servicios/${categorySlug(category)}`}>
            {imagePending ? (
              <div
                className="category-card-placeholder visual-image-skeleton"
                aria-hidden="true"
                style={{ '--category-image-position': objectPosition }}
              />
            ) : (
              <SafeImage
                className="category-card-media"
                src={imageUrl}
                alt={category}
                loading="eager"
                fetchPriority="high"
                width={640}
                height={640}
                style={{ '--category-image-position': objectPosition }}
              />
            )}
            <div className="category-card-content">
              <span className="card-kicker">{category}</span>
              <h3>{category}</h3>
              <p>{sample?.descripcion || 'Servicios especializados con profesionales del area.'}</p>
              <div className="category-card-footer">
                <strong>{categoryServices.length} servicios</strong>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        );
      })}
    </BalancedGrid>
  );
});

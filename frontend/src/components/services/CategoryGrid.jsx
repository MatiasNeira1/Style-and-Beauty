import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BalancedGrid } from '../ui/BalancedGrid.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { categorySlug, groupByCategory } from '../../utils/categoryUtils.js';

export const CategoryGrid = memo(function CategoryGrid({
  services = [],
  categoryCovers = [],
  categoryCoversLoading = false,
}) {
  const categories = useMemo(() => Object.entries(groupByCategory(services)), [services]);
  const coversByCategory = useMemo(() => categoryCovers.reduce((acc, cover) => {
    if (cover?.categoria && cover?.imagenUrl) acc[categorySlug(cover.categoria)] = cover.imagenUrl;
    return acc;
  }, {}), [categoryCovers]);

  const resolvedCategories = useMemo(() => categories.map(([category, categoryServices]) => {
    const sample = categoryServices[0];
    const coverUrl = coversByCategory[categorySlug(category)] || '';

    return {
      category,
      categoryServices,
      sample,
      imageUrl: coverUrl,
      imagePending: categoryCoversLoading && !coverUrl,
      objectPosition: 'center',
    };
  }), [categories, categoryCoversLoading, coversByCategory]);

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
            ) : imageUrl ? (
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
            ) : (
              <div
                className="category-card-placeholder"
                aria-hidden="true"
                style={{ '--category-image-position': objectPosition }}
              >
                <span>{category.slice(0, 1).toUpperCase()}</span>
              </div>
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

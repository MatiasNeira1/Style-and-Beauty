import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BalancedGrid } from '../ui/BalancedGrid.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { categorySlug, groupByCategory } from '../../utils/categoryUtils.js';

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl;
}

export const CategoryGrid = memo(function CategoryGrid({ services = [], categoryCovers = [] }) {
  const categories = useMemo(() => Object.entries(groupByCategory(services)), [services]);
  const coversByCategory = useMemo(() => categoryCovers.reduce((acc, cover) => {
    if (cover?.categoria && cover?.imagenUrl) acc[categorySlug(cover.categoria)] = cover.imagenUrl;
    return acc;
  }, {}), [categoryCovers]);

  return (
    <BalancedGrid className="category-grid public-category-grid">
      {categories.map(([category, categoryServices]) => {
        const sample = categoryServices[0];
        const imageUrl = coversByCategory[categorySlug(category)] || serviceImage(sample);

        return (
          <Link key={category} className="category-card" to={`/servicios/${categorySlug(category)}`}>
            {imageUrl ? (
              <SafeImage className="category-card-media" src={imageUrl} alt={category} />
            ) : (
              <div className="category-card-placeholder" aria-hidden="true">
                <span>{category.slice(0, 1).toUpperCase()}</span>
                <small>{categoryServices.length} servicios</small>
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

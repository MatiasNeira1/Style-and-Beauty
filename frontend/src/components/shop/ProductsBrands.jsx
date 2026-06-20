import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { BalancedGrid } from '../ui/BalancedGrid.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

export const ProductsBrands = memo(function ProductsBrands({ brands = [], onSelect }) {
  return (
    <BalancedGrid className="brand-card-grid public-category-grid">
      {brands.map((brand) => (
        <button
          key={brand.id}
          type="button"
          className="catalog-feature-card brand-feature-card"
          onClick={() => onSelect(brand)}
        >
          {brand.logo ? (
            <SafeImage src={brand.logo} alt={brand.nombre} />
          ) : (
            <span className="brand-card-placeholder" aria-hidden="true">{brand.nombre.slice(0, 1).toUpperCase()}</span>
          )}
          <span className="card-kicker">{brand.count || 0} productos</span>
          <h3>{brand.nombre}</h3>
          <p>{brand.descripcion}</p>
          <strong>Ver productos <ArrowRight size={16} /></strong>
        </button>
      ))}
    </BalancedGrid>
  );
});

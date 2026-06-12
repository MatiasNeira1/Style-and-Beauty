import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ProductEditorialShowcase } from './ProductEditorialShowcase.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

const PRODUCTS_STEP = 12;

export function ProductsByBrand({ brand, products = [], onBack, onAdd }) {
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_STEP);

  useEffect(() => {
    setVisibleCount(PRODUCTS_STEP);
  }, [brand?.id]);

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);
  const hasMoreProducts = visibleProducts.length < products.length;

  return (
    <div className="catalog-detail-view product-brand-detail">
      <div className="catalog-detail-header product-brand-header">
        <button type="button" className="text-link catalog-back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a categorias
        </button>
        <div className="product-brand-header-copy">
          {brand.logo ? (
            <SafeImage src={brand.logo} alt={brand.nombre} />
          ) : (
            <span className="brand-card-placeholder brand-card-placeholder-small" aria-hidden="true">
              {brand.nombre.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <span className="card-kicker">Categoria profesional</span>
            <h2>{brand.nombre}</h2>
            <p>{brand.descripcion}</p>
          </div>
        </div>
        <div className="product-brand-stats" aria-label="Resumen de marca">
          <span><strong>{products.length}</strong> productos</span>
        </div>
      </div>
      <ProductEditorialShowcase products={visibleProducts} onAdd={onAdd} />
      {hasMoreProducts && (
        <div className="product-load-more">
          <button type="button" className="button button-secondary" onClick={() => setVisibleCount((count) => count + PRODUCTS_STEP)}>
            Ver más productos
          </button>
        </div>
      )}
    </div>
  );
}

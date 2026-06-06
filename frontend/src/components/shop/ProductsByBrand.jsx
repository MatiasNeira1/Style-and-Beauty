import { ArrowLeft } from 'lucide-react';
import { ProductEditorialShowcase } from './ProductEditorialShowcase.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

export function ProductsByBrand({ brand, products = [], onBack, onAdd }) {
  return (
    <div className="catalog-detail-view product-brand-detail">
      <div className="catalog-detail-header product-brand-header">
        <button type="button" className="text-link catalog-back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a marcas
        </button>
        <div className="product-brand-header-copy">
          <SafeImage src={brand.logo} alt={brand.nombre} />
          <div>
            <span className="card-kicker">Marca profesional</span>
            <h2>{brand.nombre}</h2>
            <p>{brand.descripcion}</p>
          </div>
        </div>
        <div className="product-brand-stats" aria-label="Resumen de marca">
          <span><strong>{products.length}</strong> productos</span>
          <span><strong>Salon</strong> grade</span>
        </div>
      </div>
      <ProductEditorialShowcase products={products} onAdd={onAdd} />
    </div>
  );
}

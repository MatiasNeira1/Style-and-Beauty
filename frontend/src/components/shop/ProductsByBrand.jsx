import { ArrowLeft } from 'lucide-react';
import { ProductGrid } from './ProductGrid.jsx';

export function ProductsByBrand({ brand, products = [], onBack, onAdd }) {
  return (
    <div className="catalog-detail-view">
      <div className="catalog-detail-header">
        <button type="button" className="text-link catalog-back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a marcas
        </button>
        <div>
          <span className="card-kicker">Marca profesional</span>
          <h2>{brand.nombre}</h2>
          <p>{brand.descripcion}</p>
        </div>
      </div>
      <ProductGrid products={products} onAdd={onAdd} />
    </div>
  );
}

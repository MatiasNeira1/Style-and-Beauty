import { ProductCard } from './ProductCard.jsx';

export function ProductGrid({ products = [], onAdd }) {
  return (
    <div className="product-grid stagger-grid">
      {products.map((product) => (
        <ProductCard key={product.id || product.idProducto || product.nombre} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}

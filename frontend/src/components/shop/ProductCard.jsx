import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export function ProductCard({ product, onAdd }) {
  const name = product.nombre || product.name || product.nombreProducto || 'Producto profesional';
  const description = product.descripcion || product.description || product.detalle || 'Producto profesional recomendado por el salon.';
  const category = product.categoria || 'Cuidado profesional';
  const price = product.precio || product.price || product.precio_total || 0;
  const imageUrl = product.imagenUrl || product.imagen_url || product.imageUrl || product.image;
  const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);

  return (
    <article className="product-card">
      <div className="product-media" style={imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(25, 20, 23, 0.18)), url("${imageUrl}")` } : undefined} />
      <div className="product-info">
        <span className="product-category">{category}</span>
        <h3>{name}</h3>
        <p>{description}</p>
      </div>
      <div className="product-actions">
        <strong>{formattedPrice}</strong>
        <Button size="sm" onClick={() => onAdd?.({ ...product, id: product.id || product.idProducto || name, name, price })} aria-label={`Agregar ${name}`}>
          <ShoppingCart size={16} />
        </Button>
      </div>
    </article>
  );
}

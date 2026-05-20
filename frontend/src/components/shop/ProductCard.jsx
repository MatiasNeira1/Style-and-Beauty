import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';

export function ProductCard({ product, onAdd }) {
  const name = product.nombre || product.name;
  const description = product.descripcion || product.description || 'Producto profesional recomendado por el salon.';
  const price = product.precio || product.price || 0;

  return (
    <Card className="product-card">
      <div className="product-media" />
      <h3>{name}</h3>
      <p>{description}</p>
      <div className="product-actions">
        <strong>${price}</strong>
        <Button onClick={() => onAdd?.({ ...product, id: product.id || product.idProducto || name, name, price })} aria-label={`Agregar ${name}`}>
          <ShoppingCart size={18} />
        </Button>
      </div>
    </Card>
  );
}

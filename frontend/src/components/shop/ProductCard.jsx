import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';

export function ProductCard({ product, onAdd }) {
  return (
    <Card className="product-card">
      <div className="product-media" />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-actions">
        <strong>${product.price}</strong>
        <Button onClick={() => onAdd?.(product)} aria-label={`Agregar ${product.name}`}>
          <ShoppingCart size={18} />
        </Button>
      </div>
    </Card>
  );
}

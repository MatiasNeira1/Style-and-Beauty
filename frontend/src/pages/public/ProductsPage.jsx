import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '../../components/shop/ProductGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { useCart } from '../../store/CartContext.jsx';
import { inventoryService } from '../../services/inventoryService.js';

const products = [
  { id: 1, nombre: 'Shampoo nutritivo', descripcion: 'Cuidado profesional para uso diario.', precio: 12990 },
  { id: 2, nombre: 'Mascara capilar', descripcion: 'Tratamiento intensivo de hidratacion.', precio: 18990 },
  { id: 3, nombre: 'Serum glow', descripcion: 'Brillo liviano y terminacion pulida.', precio: 15990 },
];

export function ProductsPage() {
  const { addItem } = useCart();
  const { data, isLoading } = useQuery({ queryKey: ['inventory-products'], queryFn: inventoryService.listProducts });
  const catalog = Array.isArray(data) && data.length ? data : products;

  return (
    <>
      <section className="products-hero">
        <div className="products-hero-media" />
        <div className="products-hero-overlay" />
        <div className="products-hero-content">
          <span className="card-kicker">Shop</span>
          <h1>Productos profesionales</h1>
          <p>Cuidado de salon para extender el resultado en casa.</p>
        </div>
      </section>

      <section className="page-section products-section">
        {isLoading ? <Loader /> : <ProductGrid products={catalog} onAdd={addItem} />}
      </section>
    </>
  );
}

import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '../../components/shop/ProductGrid.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
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
    <section className="page-section">
      <SectionTitle eyebrow="Shop" title="Productos profesionales">Cuidado de salon para extender el resultado en casa.</SectionTitle>
      {isLoading ? <Loader /> : <ProductGrid products={catalog} onAdd={addItem} />}
    </section>
  );
}

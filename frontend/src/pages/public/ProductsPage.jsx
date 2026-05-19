import { ProductGrid } from '../../components/shop/ProductGrid.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

const products = [
  { id: 1, name: 'Shampoo nutritivo', description: 'Cuidado profesional para uso diario.', price: 12990 },
  { id: 2, name: 'Mascara capilar', description: 'Tratamiento intensivo de hidratacion.', price: 18990 },
];

export function ProductsPage() {
  return (
    <section className="page-section">
      <SectionTitle title="Productos" />
      <ProductGrid products={products} />
    </section>
  );
}

import { useMemo, useState } from 'react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ProductsBrands } from '../../components/shop/ProductsBrands.jsx';
import { ProductsByBrand } from '../../components/shop/ProductsByBrand.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { mockProducts, productBrands } from '../../mocks/products.mock.js';
import { useCart } from '../../store/CartContext.jsx';

export function ProductsPage() {
  const { addItem } = useCart();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const visibleProducts = useMemo(() => (
    selectedBrand ? mockProducts.filter((product) => product.marcaId === selectedBrand.id) : []
  ), [selectedBrand]);
  const heroTitle = selectedBrand?.nombre || 'Productos profesionales';
  const heroSubtitle = selectedBrand?.descripcion || 'Primero elige una marca y luego revisa productos recomendados.';

  return (
    <>
      <section className="products-hero">
        <div className="products-hero-media" />
        <div className="products-hero-overlay" />
        <div className="products-hero-content">
          <span className="card-kicker">Shop</span>
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
        </div>
      </section>

      <section className="page-section products-section catalog-page">
        {!selectedBrand ? (
          <>
            <SectionTitle eyebrow="Marcas" title="Catálogo por marcas">
              Productos profesionales seleccionados para cabello, piel, nails y rutinas de cuidado.
            </SectionTitle>
            <Reveal>
              <ProductsBrands brands={productBrands} products={mockProducts} onSelect={setSelectedBrand} />
            </Reveal>
          </>
        ) : (
          <Reveal>
            <ProductsByBrand brand={selectedBrand} products={visibleProducts} onAdd={addItem} onBack={() => setSelectedBrand(null)} />
          </Reveal>
        )}
      </section>
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ProductsBrands } from '../../components/shop/ProductsBrands.jsx';
import { ProductsByBrand } from '../../components/shop/ProductsByBrand.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { productService } from '../../services/productService.js';
import { useCart } from '../../store/CartContext.jsx';

function slugify(value) {
  return String(value || 'sin-categoria')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sin-categoria';
}

function productImage(product) {
  return product?.imagenUrl || product?.imagen_url || product?.imageUrl || product?.image || product?.imagen;
}

function categoryCard(category, data) {
  const name = category || 'Sin categoria';

  return {
    id: slugify(name),
    nombre: name,
    descripcion: `${data.count} productos disponibles en inventario.`,
    count: data.count,
    logo: data.logo,
  };
}

export function ProductsPage() {
  const { addItem } = useCart();
  const location = useLocation();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const productsQuery = useQuery({
    queryKey: ['public-products'],
    queryFn: productService.listProducts,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  const products = useMemo(() => {
    const rows = Array.isArray(productsQuery.data) ? productsQuery.data : [];
    return rows.filter((product) => product.activo !== false);
  }, [productsQuery.data]);

  const productBrands = useMemo(() => {
    const countsByCategory = products.reduce((acc, product) => {
      const category = product.categoria || 'Sin categoria';
      if (!acc[category]) {
        acc[category] = { count: 0, logo: productImage(product) };
      }
      acc[category].count += 1;
      if (!acc[category].logo) {
        acc[category].logo = productImage(product);
      }
      return acc;
    }, {});

    return Object.entries(countsByCategory)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([category, data]) => categoryCard(category, data));
  }, [products]);

  const visibleProducts = useMemo(() => (
    selectedBrand
      ? products.filter((product) => slugify(product.categoria || 'Sin categoria') === selectedBrand.id)
      : []
  ), [products, selectedBrand]);

  const heroTitle = selectedBrand?.nombre || 'Productos profesionales';
  const heroSubtitle = selectedBrand?.descripcion || 'Primero elige una categoria y luego revisa productos disponibles.';

  useEffect(() => {
    if (location.state?.showProductsHome) {
      setSelectedBrand(null);
    }
  }, [location.state?.showProductsHome]);

  const handleSelectBrand = useCallback((brand) => {
    setSelectedBrand(brand);
  }, []);

  const handleBackToBrands = useCallback(() => {
    setSelectedBrand(null);
  }, []);

  return (
    <>
      <section className="page-hero page-hero-products">
        <div className="page-hero-media" />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Shop</span>
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
        </div>
      </section>

      <section className="page-section products-section catalog-page">
        {!selectedBrand ? (
          <>
            <SectionTitle eyebrow="Categorias" title="Productos por categoria">
              Productos profesionales cargados desde inventario.
            </SectionTitle>
            {productsQuery.isLoading ? (
              <div className="client-empty-state" style={{ padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-muted)' }}>Cargando catálogo...</p>
              </div>
            ) : productsQuery.isError ? (
              <div className="client-empty-state" style={{ padding: '4rem 1rem', background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-line)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(212, 122, 158, 0.1)', color: 'var(--color-primary-strong)', marginBottom: '1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3>Catálogo no disponible</h3>
                <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', maxWidth: '400px', marginInline: 'auto' }}>No pudimos cargar los productos en este momento. Por favor, intenta de nuevo más tarde.</p>
              </div>
            ) : productBrands.length ? (
              <ProductsBrands brands={productBrands} onSelect={handleSelectBrand} />
            ) : (
              <div className="client-empty-state" style={{ padding: '4rem 1rem', background: 'var(--color-surface-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-line)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(212, 122, 158, 0.1)', color: 'var(--color-primary-strong)', marginBottom: '1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <h3>Sin productos</h3>
                <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', maxWidth: '400px', marginInline: 'auto' }}>Actualmente no hay productos disponibles en el inventario.</p>
              </div>
            )}
          </>
        ) : (
          <Reveal>
            <ProductsByBrand brand={selectedBrand} products={visibleProducts} onAdd={addItem} onBack={handleBackToBrands} />
          </Reveal>
        )}
      </section>
    </>
  );
}

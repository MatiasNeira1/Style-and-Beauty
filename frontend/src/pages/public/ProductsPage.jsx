import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ProductsBrands } from '../../components/shop/ProductsBrands.jsx';
import { ProductsByBrand } from '../../components/shop/ProductsByBrand.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { inventoryService } from '../../services/inventoryService.js';
import { useCart } from '../../store/CartContext.jsx';

function slugify(value) {
  return String(value || 'sin-categoria')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sin-categoria';
}

function categoryCard(category, count) {
  const name = category || 'Sin categoria';

  return {
    id: slugify(name),
    nombre: name,
    descripcion: `${count} productos disponibles en inventario.`,
    logo: '/logo.jpg',
  };
}

export function ProductsPage() {
  const { addItem } = useCart();
  const location = useLocation();
  const [selectedBrand, setSelectedBrand] = useState(null);
  const productsQuery = useQuery({
    queryKey: ['public-products'],
    queryFn: inventoryService.listProducts,
  });

  const products = useMemo(() => {
    const rows = Array.isArray(productsQuery.data) ? productsQuery.data : [];
    return rows.filter((product) => product.activo !== false);
  }, [productsQuery.data]);

  const productBrands = useMemo(() => {
    const countsByCategory = products.reduce((acc, product) => {
      const category = product.categoria || 'Sin categoria';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countsByCategory)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([category, count]) => categoryCard(category, count));
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
            <SectionTitle eyebrow="Categorias" title="Catalogo por categorias">
              Productos profesionales cargados desde inventario.
            </SectionTitle>
            {productsQuery.isLoading ? (
              <p className="admin-alert">Cargando productos...</p>
            ) : productsQuery.isError ? (
              <p className="admin-alert">{productsQuery.error.message}</p>
            ) : productBrands.length ? (
              <Reveal>
                <ProductsBrands brands={productBrands} products={products} onSelect={setSelectedBrand} />
              </Reveal>
            ) : (
              <p className="admin-alert">No hay productos disponibles en inventario.</p>
            )}
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

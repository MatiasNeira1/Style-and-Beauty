import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

function slugify(value) {
  return String(value || 'sin-categoria')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'sin-categoria';
}

export function ProductsBrands({ brands = [], products = [], onSelect }) {
  return (
    <div className="catalog-card-grid brand-card-grid">
      {brands.map((brand) => {
        const count = products.filter((product) => (
          product.marcaId === brand.id || slugify(product.categoria || 'Sin categoria') === brand.id
        )).length;
        return (
          <motion.button
            key={brand.id}
            type="button"
            className="catalog-feature-card brand-feature-card"
            onClick={() => onSelect(brand)}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <img src={brand.logo} alt={brand.nombre} loading="lazy" />
            <span className="card-kicker">{count} productos</span>
            <h3>{brand.nombre}</h3>
            <p>{brand.descripcion}</p>
            <strong>Ver productos <ArrowRight size={16} /></strong>
          </motion.button>
        );
      })}
    </div>
  );
}

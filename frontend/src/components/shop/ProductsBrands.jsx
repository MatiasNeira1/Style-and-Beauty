import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SafeImage } from '../ui/SafeImage.jsx';

export const ProductsBrands = memo(function ProductsBrands({ brands = [], onSelect }) {
  return (
    <div className="catalog-card-grid brand-card-grid">
      {brands.map((brand) => (
        <motion.button
          key={brand.id}
          type="button"
          className="catalog-feature-card brand-feature-card"
          onClick={() => onSelect(brand)}
          whileHover={{ y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <SafeImage src={brand.logo} alt={brand.nombre} />
          <span className="card-kicker">{brand.count || 0} productos</span>
          <h3>{brand.nombre}</h3>
          <p>{brand.descripcion}</p>
          <strong>Ver productos <ArrowRight size={16} /></strong>
        </motion.button>
      ))}
    </div>
  );
});

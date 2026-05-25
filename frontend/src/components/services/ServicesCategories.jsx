import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function ServicesCategories({ categories = [], services = [], onSelect }) {
  return (
    <div className="catalog-card-grid">
      {categories.map((category) => {
        const count = services.filter((service) => service.categoriaId === category.id).length;
        return (
          <motion.button
            key={category.id}
            type="button"
            className="catalog-feature-card"
            onClick={() => onSelect(category)}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <img src={category.imagen} alt={category.nombre} loading="lazy" />
            <span className="card-kicker">{count} servicios</span>
            <h3>{category.nombre}</h3>
            <p>{category.descripcion}</p>
            <strong>Ver servicios <ArrowRight size={16} /></strong>
          </motion.button>
        );
      })}
    </div>
  );
}

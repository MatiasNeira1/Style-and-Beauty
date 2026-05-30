import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const featuredOrder = ['maquillajes', 'nails'];

export function ServicesCategories({ categories = [], services = [], onSelect }) {
  const orderedCategories = [
    ...featuredOrder
      .map((id) => categories.find((category) => category.id === id))
      .filter(Boolean),
    ...categories.filter((category) => !featuredOrder.includes(category.id)),
  ];

  return (
    <div className="catalog-card-grid services-premium-grid">
      {orderedCategories.map((category, index) => {
        const count = services.filter((service) => service.categoriaId === category.id).length;
        const isFeatured = index < 2;
        return (
          <motion.button
            key={category.id}
            type="button"
            className={`catalog-feature-card service-premium-card service-premium-card-featured ${isFeatured ? '' : 'service-premium-card-standard'}`.trim()}
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

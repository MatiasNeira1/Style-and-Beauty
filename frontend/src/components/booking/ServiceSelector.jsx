import { useState, useMemo } from 'react';
import { Card } from '../ui/Card.jsx';
import { motion } from 'framer-motion';

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id || service.nombre;
}

function servicePrice(service) {
  const value = service.precio_total ?? service.precio ?? service.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

export function ServiceSelector({ services = [], selectedId, onSelect }) {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.categoria).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeCategory === 'Todos') return services;
    return services.filter(s => s.categoria === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="stack">
      {categories.length > 1 && (
        <div className="chip-group" style={{ marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid-list">
        {filteredServices.map((service, i) => (
          <motion.button
            key={service.id || service.idServicio || service.nombre}
            className={(service.id || service.idServicio) === selectedId ? 'select-card active' : 'select-card'}
            onClick={() => onSelect?.(service)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="card-kicker">{service.categoria || 'Servicio'}</span>
                <strong>${service.precio?.toLocaleString('es-CL') || service.price || 'Consultar'}</strong>
              </div>
              <h3 style={{ marginTop: '0.2rem' }}>{service.nombre || service.name}</h3>
              <p style={{ marginTop: '0.5rem' }}>{service.descripcion || service.description || 'Atención personalizada con acabado profesional.'}</p>
            </Card>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id || service.nombre;
}

function servicePrice(service) {
  const value = service.precio_total ?? service.precio ?? service.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function serviceDuration(service) {
  const duration = service.duracion_minutos ?? service.duracion ?? service.duration;
  return duration ? `${duration} min` : 'Duración por confirmar';
}

function serviceImage(service) {
  return service.imageUrl || service.imagenUrl || service.imagen_url || service.imagen || service.fotoUrl;
}

export function ServiceSelector({ services = [], selectedId, onSelect }) {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = useMemo(() => {
    const cats = new Set(services.map((service) => service.categoria).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeCategory === 'Todos') return services;
    return services.filter((service) => service.categoria === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="stack client-selector">
      {categories.length > 1 && (
        <div className="chip-group horizontal-scroll" aria-label="Categorías de servicios">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="grid-list">
        {filteredServices.map((service) => {
          const id = getServiceId(service);
          const isSelected = id === selectedId;
          return (
            <button
              key={id}
              type="button"
              className={isSelected ? 'select-card active' : 'select-card'}
              onClick={() => onSelect?.(service)}
            >
              <Card className="service-choice-card">
                <SafeImage className="service-choice-image" src={serviceImage(service)} alt={service.nombre || service.name || 'Servicio'} />
                <div className="choice-card-header">
                  <span className="card-kicker">{service.categoria || 'Servicio'}</span>
                  <strong>{servicePrice(service)}</strong>
                </div>
                <h3>{service.nombre || service.name}</h3>
                <p>{service.descripcion || service.description || 'Atención personalizada con acabado profesional.'}</p>
                <span className="choice-meta">{serviceDuration(service)}</span>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}

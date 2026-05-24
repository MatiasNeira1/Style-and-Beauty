import { Card } from '../ui/Card.jsx';

function getServiceId(service) {
  return service.id_servicio || service.idServicio || service.id || service.nombre;
}

function servicePrice(service) {
  const value = service.precio_total ?? service.precio ?? service.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

export function ServiceSelector({ services = [], selectedId, onSelect }) {
  return (
    <div className="grid-list stagger-grid">
      {services.map((service) => (
        <button
          key={getServiceId(service)}
          className={getServiceId(service) === selectedId ? 'select-card active' : 'select-card'}
          onClick={() => onSelect?.(service)}
        >
          <Card>
            <span className="card-kicker">{service.categoria || 'Servicio'}</span>
            <h3>{service.nombre || service.name}</h3>
            <p>{service.descripcion || service.description || 'Atencion personalizada con acabado profesional.'}</p>
            <strong>{servicePrice(service)}</strong>
          </Card>
        </button>
      ))}
    </div>
  );
}

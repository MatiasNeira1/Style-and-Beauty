import { Card } from '../ui/Card.jsx';

export function ServiceSelector({ services = [], selectedId, onSelect }) {
  return (
    <div className="grid-list stagger-grid">
      {services.map((service) => (
        <button
          key={service.id || service.idServicio || service.nombre}
          className={(service.id || service.idServicio) === selectedId ? 'select-card active' : 'select-card'}
          onClick={() => onSelect?.(service)}
        >
          <Card>
            <span className="card-kicker">Servicio</span>
            <h3>{service.nombre || service.name}</h3>
            <p>{service.descripcion || service.description || 'Atencion personalizada con acabado profesional.'}</p>
            <strong>${service.precio || service.price || 'Consultar'}</strong>
          </Card>
        </button>
      ))}
    </div>
  );
}

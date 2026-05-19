import { Card } from '../ui/Card.jsx';

export function ServiceSelector({ services = [], selectedId, onSelect }) {
  return (
    <div className="grid-list">
      {services.map((service) => (
        <button
          key={service.id}
          className={service.id === selectedId ? 'select-card active' : 'select-card'}
          onClick={() => onSelect?.(service)}
        >
          <Card>
            <h3>{service.name}</h3>
            <p>{service.duration} min</p>
          </Card>
        </button>
      ))}
    </div>
  );
}

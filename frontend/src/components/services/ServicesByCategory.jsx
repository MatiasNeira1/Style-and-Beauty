import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';

const currency = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

export function ServicesByCategory({ category, services = [], onBack }) {
  return (
    <div className="catalog-detail-view">
      <div className="catalog-detail-header">
        <button type="button" className="text-link catalog-back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a categorias
        </button>
        <div>
          <span className="card-kicker">{category.nombre}</span>
          <h2>{category.nombre}</h2>
          <p>{category.descripcion}</p>
        </div>
      </div>

      <div className="catalog-item-grid">
        {services.map((service) => (
          <article key={service.id} className="catalog-item-card">
            <div className="catalog-item-media" style={{ backgroundImage: `url("${service.imagen}")` }} />
            <div className="catalog-item-body">
              <span className="card-kicker">{service.duracion}</span>
              <h3>{service.nombre}</h3>
              <p>{service.descripcion}</p>
              <div className="catalog-item-footer">
                <strong>{currency.format(service.precio)}</strong>
                <Link to="/reservar">
                  <Button size="sm"><CalendarDays size={15} /> Reservar</Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

import { ArrowLeft, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';
import { SafeImage } from '../ui/SafeImage.jsx';
import { formatCLP } from '../../utils/priceUtils.js';

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

      <div className="catalog-item-grid service-showcase-grid">
        {services.map((service, index) => (
          <article key={service.id} className="catalog-item-card service-showcase-card">
            <div className="catalog-item-media">
              <SafeImage src={service.imageUrl || service.imagenUrl || service.imagen} alt={service.nombre} />
            </div>
            <div className="service-showcase-overlay" />
            <span className="service-showcase-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="catalog-item-body">
              <span className="card-kicker"><Sparkles size={13} /> {category.nombre}</span>
              <h3>{service.nombre}</h3>
              <p>{service.descripcion}</p>
              <div className="service-showcase-meta">
                <span>{service.duracion}</span>
                <strong>{formatCLP(service.precio)}</strong>
              </div>
              <div className="catalog-item-footer">
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

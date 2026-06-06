import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '../ui/SafeImage.jsx';
import { categorySlug, groupByCategory } from '../../utils/categoryUtils.js';

function serviceImage(service) {
  return service?.imageUrl || service?.imagenUrl || service?.imagen_url || service?.imagen || service?.fotoUrl;
}

export function CategoryGrid({ services = [] }) {
  const categories = Object.entries(groupByCategory(services));

  return (
    <div className="category-grid">
      {categories.map(([category, categoryServices]) => {
        const sample = categoryServices[0];

        return (
          <Link key={category} className="category-card" to={`/servicios/${categorySlug(category)}`}>
            <SafeImage className="category-card-media" src={serviceImage(sample)} alt={category} />
            <div className="category-card-content">
              <span className="card-kicker">{category}</span>
              <h3>{category}</h3>
              <p>{sample?.descripcion || 'Servicios especializados con profesionales del area.'}</p>
              <div className="category-card-footer">
                <strong>{categoryServices.length} servicios</strong>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

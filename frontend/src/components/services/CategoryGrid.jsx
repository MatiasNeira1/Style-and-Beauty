import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categorySlug, groupByCategory, normalizeCategory } from '../../utils/categoryUtils.js';

const categoryImages = [
  {
    match: ['peluqueria', 'pelo', 'cabello', 'corte', 'color'],
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
  },
  {
    match: ['facial', 'skin', 'piel', 'cosmetologia'],
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
  },
  {
    match: ['manicura', 'unas', 'manos', 'nails'],
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  },
  {
    match: ['masaje', 'masoterapia', 'spa', 'relajacion'],
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
  },
  {
    match: ['maquillaje', 'makeup'],
    url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  },
];

const fallbackImage = 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80';

function categoryImage(category) {
  const normalized = normalizeCategory(category);
  return categoryImages.find((item) => item.match.some((term) => normalized.includes(term)))?.url || fallbackImage;
}

export function CategoryGrid({ services = [] }) {
  const categories = Object.entries(groupByCategory(services));

  return (
    <div className="category-grid">
      {categories.map(([category, categoryServices]) => {
        const sample = categoryServices[0];

        return (
          <Link key={category} className="category-card" to={`/servicios/${categorySlug(category)}`}>
            <img className="category-card-media" src={categoryImage(category)} alt={category} loading="lazy" />
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

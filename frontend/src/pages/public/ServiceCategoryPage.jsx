import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { catalogService } from '../../services/catalogService.js';
import { categorySlug, findCategoryBySlug, groupByCategory } from '../../utils/categoryUtils.js';

function servicePrice(service) {
  const value = service.precio_total ?? service.precio ?? service.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

export function ServiceCategoryPage() {
  const { categoria } = useParams();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });

  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const grouped = groupByCategory(services);
  const categories = Object.keys(grouped);
  const category = findCategoryBySlug(categories, categoria) || categories[0] || 'General';
  const categoryServices = grouped[category] || [];

  return (
    <section className="page-section">
      <Link className="text-link service-back-link" to="/servicios">
        <ArrowLeft size={16} />
        Categorias
      </Link>

      <SectionTitle eyebrow="Categoria" title={category}>
        Elige un servicio para revisar su detalle y los profesionales disponibles.
      </SectionTitle>

      {servicesQuery.isLoading ? (
        <Loader />
      ) : servicesQuery.isError ? (
        <p className="admin-alert">{servicesQuery.error.message}</p>
      ) : categoryServices.length === 0 ? (
        <p className="admin-alert">No hay servicios cargados para esta categoria.</p>
      ) : (
        <Reveal>
          <div className="category-detail-layout">
            <div className="category-service-list">
              {categoryServices.map((service) => (
                <Link
                  key={service.id_servicio || service.idServicio || service.id || service.nombre}
                  className="category-service-card category-service-link"
                  to={`/servicios/${categorySlug(category)}/${categorySlug(service.nombre || service.name || service.id_servicio || service.idServicio || service.id)}`}
                >
                  <span className="card-kicker">Servicio</span>
                  <h3>{service.nombre || service.name}</h3>
                  <p>{service.descripcion || service.description || 'Atencion personalizada con acabado profesional.'}</p>
                  <div className="category-service-meta">
                    <strong>{servicePrice(service)}</strong>
                    <span><Clock size={14} /> {service.duracion_minutos || service.duracion || 45} min</span>
                  </div>
                  <span className="service-open-link">
                    Ver detalle <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}

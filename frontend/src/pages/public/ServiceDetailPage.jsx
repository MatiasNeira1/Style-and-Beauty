import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ProfessionalProfiles } from '../../components/services/ProfessionalProfiles.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { normalizeProfessional } from '../../hooks/useProfessionals.js';
import { categorySlug, findCategoryBySlug, groupByCategory, normalizeCategory } from '../../utils/categoryUtils.js';

const serviceImages = [
  {
    match: ['peluqueria', 'pelo', 'cabello', 'corte', 'color'],
    url: 'https://www.loreal-paris.com.mx/-/media/project/loreal/brand-sites/oap/americas/mx/articles/blog-de-belleza/cuidado-del-cabello/espuma-para-el-cabello/banner.jpg?cx=0.53&cy=0.24&cw=2000&ch=815&hash=4415F77E19A31614BD6CC4B1879D2A61',
  },
  {
    match: ['facial', 'skin', 'piel', 'cosmetologia'],
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1800&q=82',
  },
  {
    match: ['manicura', 'unas', 'manos', 'nails'],
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1800&q=82',
  },
  {
    match: ['masaje', 'masoterapia', 'spa', 'relajacion'],
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1800&q=82',
  },
  {
    match: ['maquillaje', 'makeup'],
    url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1800&q=82',
  },
];

const fallbackImage = 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=82';

function servicePrice(service) {
  const value = service?.precio_total ?? service?.precio ?? service?.price;
  if (value === undefined || value === null || value === '') return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

function serviceDuration(service) {
  return service?.duracion_minutos || service?.duracion || service?.duration || 45;
}

function heroImage(category, service) {
  const source = normalizeCategory(`${category} ${service?.nombre || service?.name || ''}`);
  return serviceImages.find((item) => item.match.some((term) => source.includes(term)))?.url || fallbackImage;
}

function serviceMatchesSlug(service, slug) {
  const names = [
    service?.nombre,
    service?.name,
    service?.id_servicio,
    service?.idServicio,
    service?.id,
  ].filter(Boolean);

  return names.some((value) => categorySlug(value) === slug);
}

export function ServiceDetailPage() {
  const { categoria, servicio } = useParams();
  const navigate = useNavigate();
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });

  const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
  const grouped = groupByCategory(services);
  const categories = Object.keys(grouped);
  const category = findCategoryBySlug(categories, categoria) || categories[0] || 'General';
  const categoryServices = grouped[category] || [];
  const service = categoryServices.find((item) => serviceMatchesSlug(item, servicio));

  const serviceId = service?.id_servicio || service?.idServicio || service?.id;
  const specialistsQuery = useQuery({
    queryKey: ['service-specialists', serviceId],
    queryFn: () => catalogService.listProfessionalsByService(serviceId),
    enabled: !!serviceId,
  });

  const rawSpecialists = Array.isArray(specialistsQuery.data) ? specialistsQuery.data : [];
  const specialists = rawSpecialists.map((member, idx) => normalizeProfessional(member, idx));

  // Only block render on services loading — specialists query may be disabled (no serviceId yet)
  const isServicesLoading = servicesQuery.isLoading;
  const isSpecialistsLoading = !!serviceId && specialistsQuery.isFetching;

  if (isServicesLoading || isSpecialistsLoading) {
    return (
      <section className="page-section">
        <Loader />
      </section>
    );
  }

  if (servicesQuery.isError) {
    return (
      <section className="page-section">
        <p className="admin-alert">{servicesQuery.error?.message}</p>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="page-section">
        <Link className="text-link service-back-link" to="/servicios">
          <ArrowLeft size={16} />
          Servicios
        </Link>
        <p className="admin-alert">El servicio solicitado no existe en el catalogo.</p>
      </section>
    );
  }

  return (
    <section className="service-detail-page">
      <div
        className="service-detail-banner"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(25, 20, 23, 0.7), rgba(25, 20, 23, 0.28)), url("${heroImage(category, service)}")` }}
      >
        <div className="service-detail-banner-inner">
          <Link className="service-detail-back" to={`/servicios/${categorySlug(category)}`}>
            <ArrowLeft size={16} />
            {category}
          </Link>
          <span className="card-kicker">{category}</span>
          <h1>{service.nombre || service.name || 'Servicio'}</h1>
          <p>{service.descripcion || service.description || 'Atencion personalizada con tecnica profesional y seguimiento cercano.'}</p>
          <div className="service-detail-meta">
            <strong>{servicePrice(service)}</strong>
            <span><Clock size={15} /> {serviceDuration(service)} min</span>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="service-detail-content">
          <section className="service-description-panel">
            <span className="card-kicker">Detalle del servicio</span>
            <h2>{service.nombre || service.name || 'Servicio personalizado'}</h2>
            <p>{service.detallerservicio || service.description || 'Este servicio se adapta al diagnostico del profesional y a tus preferencias.'}</p>
            <Link className="button button-sm" to="/reservar">
              <CalendarDays size={16} />
              Reservar
            </Link>
          </section>

          <section className="service-professionals-section">
            <span className="card-kicker">Profesionales</span>
            <h2>Especialistas disponibles</h2>
            <ProfessionalProfiles
              professionals={specialists}
              emptyText="Pronto asignaremos especialistas para este servicio."
              onSelect={(prof) => navigate('/reservar', { state: { service, professional: prof.raw || prof } })}
            />
          </section>
        </div>
      </Reveal>
    </section>
  );
}

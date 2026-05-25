import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ProfessionalProfiles } from '../../components/services/ProfessionalProfiles.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { catalogService } from '../../services/catalogService.js';
import { profileService } from '../../services/profileService.js';
import { categorySlug, findCategoryBySlug, groupByCategory, normalizeCategory } from '../../utils/categoryUtils.js';

const fallbackServices = [
  { id: 'color', nombre: 'Color premium', categoria: 'Color', descripcion: 'Coloracion, brillo y cuidado de fibra.', precio: 45990 },
  { id: 'hair', nombre: 'Corte signature', categoria: 'Peluqueria', descripcion: 'Corte personalizado con styling final.', precio: 22990 },
  { id: 'skin', nombre: 'Ritual facial', categoria: 'Facial', descripcion: 'Limpieza profunda y luminosidad inmediata.', precio: 34990 },
];

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
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const staffQuery = useQuery({ queryKey: ['public-staff'], queryFn: profileService.listPublicStaff });

  const services = Array.isArray(servicesQuery.data) && servicesQuery.data.length ? servicesQuery.data : fallbackServices;
  const staff = Array.isArray(staffQuery.data) ? staffQuery.data : [];
  const grouped = groupByCategory(services);
  const categories = Object.keys(grouped);
  const category = findCategoryBySlug(categories, categoria) || categories[0] || 'General';
  const categoryServices = grouped[category] || [];
  const service = categoryServices.find((item) => serviceMatchesSlug(item, servicio)) || categoryServices[0];
  const specialists = staff.filter((member) => normalizeCategory(member.especialidad?.nombre) === normalizeCategory(category));
  const isLoading = servicesQuery.isLoading || staffQuery.isLoading;

  if (isLoading) {
    return (
      <section className="page-section">
        <Loader />
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
          <h1>{service?.nombre || service?.name || 'Servicio'}</h1>
          <p>{service?.descripcion || service?.description || 'Atencion personalizada con tecnica profesional y seguimiento cercano.'}</p>
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
            <h2>{service?.nombre || service?.name || 'Servicio personalizado'}</h2>
            <p>{service?.detallerservicio || service?.description || 'Este servicio se adapta al diagnostico del profesional y a tus preferencias.'}</p>
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
            />
          </section>
        </div>
      </Reveal>
    </section>
  );
}

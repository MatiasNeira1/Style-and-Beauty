import { useQuery } from '@tanstack/react-query';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ServiceSelector } from '../../components/booking/ServiceSelector.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { catalogService } from '../../services/catalogService.js';

const fallbackServices = [
  { id: 'color', nombre: 'Color premium', descripcion: 'Coloracion, brillo y cuidado de fibra.', precio: 45990 },
  { id: 'hair', nombre: 'Corte signature', descripcion: 'Corte personalizado con styling final.', precio: 22990 },
  { id: 'skin', nombre: 'Ritual facial', descripcion: 'Limpieza profunda y luminosidad inmediata.', precio: 34990 },
];

export function ServicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const services = Array.isArray(data) && data.length ? data : fallbackServices;

  return (
    <section className="page-section">
      <SectionTitle eyebrow="Catalogo" title="Servicios de salon">Elige una experiencia y agenda en pocos pasos.</SectionTitle>
      {isLoading ? <Loader /> : <Reveal stagger><ServiceSelector services={services} /></Reveal>}
    </section>
  );
}

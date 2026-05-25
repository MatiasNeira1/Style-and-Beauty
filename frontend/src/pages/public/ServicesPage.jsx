import { useQuery } from '@tanstack/react-query';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { CategoryGrid } from '../../components/services/CategoryGrid.jsx';
import { Loader } from '../../components/ui/Loader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { catalogService } from '../../services/catalogService.js';

const fallbackServices = [
  { id: 'color', nombre: 'Color premium', categoria: 'Color', descripcion: 'Coloracion, brillo y cuidado de fibra.', precio: 45990 },
  { id: 'hair', nombre: 'Corte signature', categoria: 'Peluqueria', descripcion: 'Corte personalizado con styling final.', precio: 22990 },
  { id: 'skin', nombre: 'Ritual facial', categoria: 'Facial', descripcion: 'Limpieza profunda y luminosidad inmediata.', precio: 34990 },
];

export function ServicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: catalogService.listServices });
  const services = Array.isArray(data) && data.length ? data : fallbackServices;

  return (
    <section className="page-section">
      <SectionTitle eyebrow="Catalogo" title="Categorias de servicios">Elige un area para revisar servicios y profesionales especialistas.</SectionTitle>
      {isLoading ? (
        <Loader />
      ) : (
        <Reveal>
          <CategoryGrid services={services} />
        </Reveal>
      )}
    </section>
  );
}

import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function HomePage() {
  return (
    <section className="hero-section">
      <SectionTitle eyebrow="Salon integral" title="Style & Beauty">
        Reserva servicios, compra productos y gestiona tu experiencia desde una sola plataforma.
      </SectionTitle>
      <Link to="/reservar"><Button>Reservar ahora</Button></Link>
    </section>
  );
}

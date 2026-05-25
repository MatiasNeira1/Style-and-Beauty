import { Link } from 'react-router-dom';
import { Sparkles, Star, Timer } from 'lucide-react';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { ParallaxSection } from '../../components/animations/ParallaxSection.jsx';
import { MagneticButton } from '../../components/animations/MagneticButton.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Card } from '../../components/ui/Card.jsx';

export function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <Reveal className="hero-content">
          <SectionTitle eyebrow="Salon premium" title="Style & Beauty">
            Belleza editorial, agenda inteligente y productos profesionales en una experiencia digital fluida.
          </SectionTitle>
          <div className="hero-actions">
            <Link to="/reservar"><MagneticButton>Reservar experiencia</MagneticButton></Link>
            <Link to="/servicios" className="text-link">Ver servicios</Link>
          </div>
        </Reveal>
      </section>
      <ParallaxSection className="experience-band">
        <div className="parallax-layer" />
        <Reveal stagger className="premium-grid">
          <Card><Sparkles /><h3>Diagnostico experto</h3><p>Servicios seleccionados por necesidad, estilo y rutina.</p></Card>
          <Card><Timer /><h3>Agenda precisa</h3><p>Reserva en pasos claros con confirmacion y resumen inmediato.</p></Card>
          <Card><Star /><h3>Acabado premium</h3><p>Una experiencia visual limpia, rapida y sofisticada.</p></Card>
        </Reveal>
      </ParallaxSection>
    </>
  );
}

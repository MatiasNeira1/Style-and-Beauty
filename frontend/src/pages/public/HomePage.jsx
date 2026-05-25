import { Link } from 'react-router-dom';
import { Sparkles, Star, Timer, Scissors, Heart, Award, ArrowRight, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Reveal } from '../../components/animations/Reveal.jsx';
import { TextReveal } from '../../components/animations/TextReveal.jsx';
import { ParticleField } from '../../components/animations/ParticleField.jsx';
import { AuroraBackground } from '../../components/animations/AuroraBackground.jsx';
import { GlowCard } from '../../components/animations/GlowCard.jsx';
import { CountUp } from '../../components/animations/CountUp.jsx';
import { MagneticButton } from '../../components/animations/MagneticButton.jsx';
import { ParallaxSection } from '../../components/animations/ParallaxSection.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

const features = [
  { icon: Sparkles, title: 'Diagnóstico experto', desc: 'Servicios seleccionados por necesidad, estilo y rutina personal.' },
  { icon: Timer, title: 'Agenda precisa', desc: 'Reserva en pasos claros con confirmación y resumen inmediato.' },
  { icon: Star, title: 'Acabado premium', desc: 'Una experiencia visual limpia, rápida y sofisticada.' },
];

const services = [
  { icon: Scissors, name: 'Corte Signature', desc: 'Corte personalizado con styling final de salón.', price: '$22.990' },
  { icon: Heart, name: 'Ritual Facial', desc: 'Limpieza profunda y luminosidad inmediata.', price: '$34.990' },
  { icon: Star, name: 'Color Premium', desc: 'Coloración profesional, brillo y cuidado de fibra.', price: '$45.990' },
];

const stats = [
  { value: 2500, suffix: '+', label: 'Clientes felices' },
  { value: 8, suffix: '+', label: 'Años de experiencia' },
  { value: 15, suffix: '', label: 'Profesionales' },
  { value: 98, suffix: '%', label: 'Satisfacción' },
];

const testimonials = [
  { quote: 'La mejor experiencia de salón que he tenido. El equipo es increíble y los resultados superaron mis expectativas.', author: 'Valentina R.', role: 'Cliente frecuente' },
  { quote: 'Reservar online es facilísimo y siempre me reciben puntual. Los productos que usan son de primera calidad.', author: 'Carolina M.', role: 'Cliente premium' },
  { quote: 'El ritual facial transformó mi piel. El ambiente es súper relajante y el trato personalizado marca la diferencia.', author: 'Francisca L.', role: 'Cliente desde 2023' },
];

export function HomePage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero-section">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <AuroraBackground />
        <ParticleField count={40} />

        <div className="hero-content">
          <Reveal>
            <span className="section-title">
              <span>Salón premium</span>
            </span>
          </Reveal>
          <TextReveal className="section-title" style={{ marginBottom: '1rem' }}>
            Style & Beauty
          </TextReveal>
          <Reveal delay={0.4}>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: '1.15rem', maxWidth: '540px', lineHeight: 1.65, marginBottom: '0.5rem' }}>
              Belleza editorial, agenda inteligente y productos profesionales en una experiencia digital fluida.
            </p>
          </Reveal>
          <Reveal delay={0.6}>
            <div className="hero-actions">
              <Link to="/reservar"><MagneticButton>Reservar experiencia</MagneticButton></Link>
              <Link to="/servicios" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Ver servicios <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="page-section">
        <Reveal>
          <SectionTitle eyebrow="Experiencia" title="¿Por qué elegirnos?">
            Cada detalle está pensado para brindarte una experiencia que va más allá de lo convencional.
          </SectionTitle>
        </Reveal>

        <Reveal stagger className="premium-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <GlowCard key={title}>
              <div className="feature-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="stats-section">
            {stats.map(({ value, suffix, label }) => (
              <motion.div
                key={label}
                className="stat-item"
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <CountUp value={value} suffix={suffix} />
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══ SERVICES PREVIEW ═══ */}
      <ParallaxSection className="experience-band">
        <div className="parallax-layer" />
        <Reveal>
          <SectionTitle eyebrow="Catálogo" title="Nuestros servicios">
            Desde cortes signature hasta rituales faciales, cada servicio es una experiencia de lujo.
          </SectionTitle>
        </Reveal>
        <Reveal stagger className="premium-grid">
          {services.map(({ icon: Icon, name, desc, price }) => (
            <GlowCard key={name} className="service-preview-card">
              <div className="feature-icon"><Icon size={22} /></div>
              <h3>{name}</h3>
              <p>{desc}</p>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="service-price">{price}</span>
                <Link to="/reservar" className="text-link" style={{ fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  Reservar <ArrowRight size={14} />
                </Link>
              </div>
            </GlowCard>
          ))}
        </Reveal>
      </ParallaxSection>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="page-section">
        <Reveal>
          <SectionTitle eyebrow="Opiniones" title="Lo que dicen nuestros clientes">
            La confianza y satisfacción de quienes nos eligen es nuestra mejor carta de presentación.
          </SectionTitle>
        </Reveal>
        <Reveal stagger className="testimonials-grid">
          {testimonials.map(({ quote, author, role }) => (
            <div key={author} className="testimonial-card">
              <Quote size={24} style={{ color: 'var(--color-primary)', opacity: 0.5, marginBottom: '0.8rem' }} />
              <p className="testimonial-quote">{quote}</p>
              <div>
                <div className="testimonial-author">{author}</div>
                <div className="testimonial-role">{role}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="cta-section cta-section-centered">
        <AuroraBackground />
        <Reveal>
          <SectionTitle eyebrow="Comienza ahora" title="Tu transformación te espera">
            Agenda tu primera experiencia premium y descubre por qué miles de clientes confían en nosotros.
          </SectionTitle>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="cta-actions">
            <Link to="/reservar"><MagneticButton><Award size={18} /> Reservar ahora</MagneticButton></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

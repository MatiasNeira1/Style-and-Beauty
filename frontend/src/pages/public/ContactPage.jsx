import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, ExternalLink, Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

const whatsappUrl = 'https://wa.me/56958612677';
const instagramUrl = 'https://www.instagram.com/dri.glow_';
const facebookUrl = 'https://www.facebook.com/drhiaishna.martinez.1';
const contactEmail = 'drhiaishna@styleandbeauty.com';

const contactItems = [
  { icon: Phone, label: 'Telefono', value: '+56 9 5861 2677', href: 'tel:+56958612677' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+56 9 5861 2677', href: whatsappUrl, external: true },
  { icon: Mail, label: 'Correo', value: contactEmail, href: `mailto:${contactEmail}` },
  { icon: Instagram, label: 'Instagram', value: '@dri.glow_', href: instagramUrl, external: true },
  { icon: ExternalLink, label: 'Facebook', value: 'Dra. Hiaishna Martinez', href: facebookUrl, external: true },
  { icon: MapPin, label: 'Direccion', value: 'Av. Providencia 1234, Santiago' },
  { icon: Clock, label: 'Horario', value: 'Lun a Sab, 09:00 a 19:30' },
];

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <>
      <section className="page-hero page-hero-contact">
        <div className="page-hero-media" />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Contacto</span>
          <h1>Estamos cerca para cuidar cada detalle</h1>
          <p>Escribenos para dudas, cambios de agenda, tratamientos especiales o acompanamiento antes de reservar.</p>
        </div>
      </section>

      <section className="page-section contact-page client-view">
        <SectionTitle eyebrow="Hablanos" title="Conversemos sobre tu proxima visita">
          Dejanos tus datos y el equipo coordinara la mejor alternativa para ti.
        </SectionTitle>

        <div className="contact-layout">
          <Card className="contact-form-card">
            <form className="stack" onSubmit={handleSubmit}>
              <div className="form-grid">
                <Input id="contact-name" name="name" label="Nombre" required />
                <Input id="contact-email" name="email" label="Email" type="email" required />
                <Input id="contact-phone" name="phone" label="Telefono" />
                <Input id="contact-subject" name="subject" label="Motivo" />
              </div>
              <Input id="contact-message" name="message" as="textarea" label="Mensaje" rows={6} required />
              {sent && <p className="success-alert">Mensaje preparado. El equipo te contactara a la brevedad.</p>}
              <Button type="submit"><Send size={18} /> Enviar mensaje</Button>
            </form>
          </Card>

          <aside className="contact-side">
            <Card className="contact-highlight">
              <CalendarDays size={28} />
              <h3>Reserva con disponibilidad real</h3>
              <p>Si ya sabes que servicio necesitas, agenda directamente con el profesional disponible.</p>
              <Link to="/reservar"><Button type="button">Reservar ahora</Button></Link>
            </Card>

            <div className="contact-info-grid">
              {contactItems.map(({ icon: Icon, label, value, href, external }) => (
                <Card
                  key={label}
                  as={href ? 'a' : 'article'}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="contact-info-card"
                >
                  <Icon size={20} />
                  <span>{label}</span>
                  <strong>{value}</strong>
                </Card>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

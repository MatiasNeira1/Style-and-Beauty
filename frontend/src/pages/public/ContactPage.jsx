import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, ExternalLink, Instagram, Lock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { contactService } from '../../services/contactService.js';
import { useAuth } from '../../store/AuthContext.jsx';

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sent, setSent] = useState(false);
  const contactMutation = useMutation({ mutationFn: contactService.sendMessage });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSent(false);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      await contactMutation.mutateAsync(payload);
      setSent(true);
      form.reset();
    } catch {
      setSent(false);
    }
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
          <section className="contact-form-card" aria-label="Formulario de contacto">
            {!isAuthenticated ? (
              <Card className="client-auth-card contact-auth-card">
                <div className="client-auth-icon"><Lock size={32} /></div>
                <h2>Debes iniciar sesión para continuar.</h2>
                <p>Necesitamos asociar tu mensaje a tu cuenta antes de enviarlo al equipo.</p>
                <Button onClick={() => navigate('/login', { state: { from: location } })}>Ir a iniciar sesión</Button>
              </Card>
            ) : (
              <form className="stack" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <Input id="contact-name" name="name" label="Nombre" required />
                  <Input id="contact-email" name="email" label="Email" type="email" required />
                  <Input id="contact-phone" name="phone" label="Telefono" />
                  <Input id="contact-subject" name="subject" label="Motivo" />
                </div>
                <Input id="contact-message" name="message" as="textarea" label="Mensaje" rows={6} required />
                {sent && <p className="success-alert">Mensaje enviado. El equipo te contactara a la brevedad.</p>}
                {contactMutation.isError && <p className="admin-alert">{contactMutation.error?.message || 'No fue posible enviar el mensaje.'}</p>}
                <Button type="submit" disabled={contactMutation.isPending}>
                  <Send size={18} /> {contactMutation.isPending ? 'Enviando...' : 'Enviar mensaje'}
                </Button>
              </form>
            )}
          </section>

          <aside className="contact-side">
            <div className="contact-highlight">
              <div className="contact-highlight-icon"><CalendarDays size={18} /></div>
              <div>
                <h3>Agenda online</h3>
                <p>Elige servicio, profesional y horario disponible.</p>
              </div>
              <Link to="/reservar" className="contact-reserve-link">Reservar</Link>
            </div>

            <div className="contact-info-grid">
              {contactItems.map(({ icon: Icon, label, value, href, external }) => (
                <ComponentContactItem
                  key={label}
                  as={href ? 'a' : 'article'}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="contact-info-card"
                >
                  <span className="contact-info-icon"><Icon size={17} /></span>
                  <span className="contact-info-text">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </span>
                </ComponentContactItem>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function ComponentContactItem({ as: Component = 'article', children, ...props }) {
  return <Component {...props}>{children}</Component>;
}

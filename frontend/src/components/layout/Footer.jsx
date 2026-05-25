import { ExternalLink, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

const whatsappUrl = 'https://wa.me/56958612677';
const instagramUrl = 'https://www.instagram.com/dri.glow_';
const facebookUrl = 'https://www.facebook.com/drhiaishna.martinez.1';
const contactEmail = 'drhiaishna@styleandbeauty.com';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <strong>Style &amp; Beauty</strong>
          <p>Salón premium de estética, agenda inteligente y cuidado profesional.</p>
        </div>
        <div className="footer-links">
          <h4>Navegación</h4>
          <a href="/servicios">Servicios</a>
          <a href="/productos">Productos</a>
          <a href="/reservar">Reservar</a>
          <a href="/contacto">Contacto</a>
        </div>
        <div className="footer-contact">
          <h4>Contacto</h4>
          <a href="tel:+56958612677"><Phone size={14} /> +56 9 5861 2677</a>
          <a href={`mailto:${contactEmail}`}><Mail size={14} /> {contactEmail}</a>
          <span><MapPin size={14} /> Santiago, Chile</span>
          <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a>
          <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={14} /> @dri.glow_</a>
          <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><ExternalLink size={14} /> Facebook</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Style &amp; Beauty. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

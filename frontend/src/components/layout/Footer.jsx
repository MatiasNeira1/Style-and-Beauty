import { Instagram, Mail, MapPin, Phone } from 'lucide-react';

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
          <a href="#"><Phone size={14} /> +56 9 1234 5678</a>
          <a href="#"><Mail size={14} /> hello@styleandbeauty.cl</a>
          <a href="#"><MapPin size={14} /> Santiago, Chile</a>
          <a href="#" aria-label="Instagram"><Instagram size={14} /> @styleandbeauty</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Style &amp; Beauty. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}

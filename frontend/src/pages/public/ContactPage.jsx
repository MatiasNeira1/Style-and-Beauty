import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';

export function ContactPage() {
  return (
    <section className="page-section">
      <SectionTitle title="Contacto" />
      <form className="stack">
        <Input id="contact-name" label="Nombre" />
        <Input id="contact-email" label="Email" type="email" />
        <Input id="contact-message" label="Mensaje" />
        <Button>Enviar</Button>
      </form>
    </section>
  );
}

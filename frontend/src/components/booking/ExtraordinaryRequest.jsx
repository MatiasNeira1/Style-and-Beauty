import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';

export function ExtraordinaryRequest({ onSubmit }) {
  return (
    <form className="stack" onSubmit={onSubmit}>
      <Input id="extra-name" label="Nombre" name="name" />
      <Input id="extra-detail" label="Solicitud" name="detail" />
      <Button type="submit">Enviar solicitud</Button>
    </form>
  );
}

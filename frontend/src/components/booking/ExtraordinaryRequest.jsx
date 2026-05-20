import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';

export function ExtraordinaryRequest({ register, errors = {}, onSubmit, isSubmitting }) {
  return (
    <form className="stack" onSubmit={onSubmit}>
      <Input id="extra-name" label="Nombre" error={errors.nombre?.message} {...register?.('nombre')} />
      <Input id="extra-date" label="Fecha especial" type="date" error={errors.fecha?.message} {...register?.('fecha')} />
      <Input id="extra-detail" label="Solicitud" as="textarea" rows="5" error={errors.detalle?.message} {...register?.('detalle')} />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar solicitud'}</Button>
    </form>
  );
}

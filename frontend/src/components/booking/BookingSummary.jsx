import { Card } from '../ui/Card.jsx';

function formatDate(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function bufferMinutes(slot) {
  if (!slot?.fin || !slot?.finConHolgura) return null;
  return Math.max(0, Math.round((new Date(slot.finConHolgura) - new Date(slot.fin)) / 60000));
}

function servicePrice(service) {
  const value = service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.price ?? 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}

export function BookingSummary({ service, staff, date, time, slot }) {
  const holgura = bufferMinutes(slot);

  return (
    <Card className="summary-card">
      <h3>Resumen</h3>
      <p>Servicio: {service?.nombre || service?.name || 'Pendiente'}</p>
      <p>Profesional: {staff?.nombre || staff?.name || 'Pendiente'}</p>
      <p>Fecha: {date ? formatDate(`${date}T00:00:00`) : 'Pendiente'}</p>
      <p>Hora: {formatTime(time)}</p>
      <p>Preparacion interna: {holgura === null ? 'Segun servicio' : `${holgura} min posteriores`}</p>
      <strong>Total estimado: {servicePrice(service)}</strong>
    </Card>
  );
}

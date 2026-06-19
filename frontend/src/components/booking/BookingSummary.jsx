import { Card } from '../ui/Card.jsx';
import { RESERVATION_DEPOSIT_CLP, formatCLP } from '../../utils/priceUtils.js';

function formatDate(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function servicePrice(service) {
  const value = service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.price ?? 0;
  return formatCLP(value);
}

export function BookingSummary({ service, staff, date, time, slot }) {
  const endTime = slot?.finAtencion || slot?.finVisible || slot?.fin;

  return (
    <Card className="summary-card">
      <h3>Resumen</h3>
      <p>Servicio: {service?.nombre || service?.name || 'Pendiente'}</p>
      <p>Profesional: {staff?.nombre || staff?.name || 'Pendiente'}</p>
      <p>Fecha: {date ? formatDate(`${date}T00:00:00`) : 'Pendiente'}</p>
      <p>Hora: {formatTime(time)}{endTime ? ` - ${formatTime(endTime)}` : ''}</p>
      <p>Duracion: {slot?.duracionServicioMin || service?.duracion_minutos || service?.duracion || 'Pendiente'} min</p>
      <strong>Valor del servicio: {servicePrice(service)}</strong>
      <strong>Abono WebPay: {formatCLP(RESERVATION_DEPOSIT_CLP)}</strong>
    </Card>
  );
}

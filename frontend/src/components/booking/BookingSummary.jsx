import { Card } from '../ui/Card.jsx';

function formatDate(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function BookingSummary({ service, staff, date, time }) {
  return (
    <Card className="summary-card">
      <h3>Resumen</h3>
      <p>Servicio: {service?.nombre || service?.name || 'Pendiente'}</p>
      <p>Profesional: {staff?.nombre || staff?.name || 'Pendiente'}</p>
      <p>Fecha: {date ? formatDate(`${date}T00:00:00`) : 'Pendiente'}</p>
      <p>Hora: {formatTime(time)}</p>
      <p>Preparacion interna: 20 min posteriores</p>
      <strong>Total estimado: ${service?.precio || service?.price || 0}</strong>
    </Card>
  );
}

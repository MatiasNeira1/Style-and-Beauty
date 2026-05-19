import { Card } from '../ui/Card.jsx';

export function BookingSummary({ service, staff, date, time }) {
  return (
    <Card className="summary-card">
      <h3>Resumen</h3>
      <p>Servicio: {service?.nombre || service?.name || 'Pendiente'}</p>
      <p>Profesional: {staff?.nombre || staff?.name || 'Pendiente'}</p>
      <p>Fecha: {date || 'Pendiente'}</p>
      <p>Hora: {time || 'Pendiente'}</p>
      <strong>Total estimado: ${service?.precio || service?.price || 0}</strong>
    </Card>
  );
}

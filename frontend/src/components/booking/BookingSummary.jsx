import { Card } from '../ui/Card.jsx';

export function BookingSummary({ service, staff, date, time }) {
  return (
    <Card className="summary-card">
      <h3>Resumen</h3>
      <p>Servicio: {service?.name || 'Pendiente'}</p>
      <p>Profesional: {staff?.name || 'Pendiente'}</p>
      <p>Fecha: {date || 'Pendiente'}</p>
      <p>Hora: {time || 'Pendiente'}</p>
    </Card>
  );
}

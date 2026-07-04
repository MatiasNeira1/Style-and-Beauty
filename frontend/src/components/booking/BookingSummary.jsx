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

function servicePriceValue(service) {
  return Number(service?.precio_total ?? service?.precioTotal ?? service?.precio ?? service?.price ?? 0);
}

function serviceCategory(service) {
  return service?.categoria || service?.category || 'Pendiente';
}

function staffName(staff) {
  return `${staff?.nombre || staff?.name || 'Pendiente'} ${staff?.apellidos || ''}`.trim();
}

function clientName(client) {
  return `${client?.nombre || ''} ${client?.apellidos || ''}`.trim() || 'Pendiente';
}

function clientEmail(client) {
  return client?.emailContacto || client?.email || client?.correo || 'Pendiente';
}

function clientPhone(client) {
  return client?.telefono || client?.phone || 'Pendiente';
}

export function BookingSummary({ service, staff, client, date, time, slot }) {
  const endTime = slot?.finAtencion || slot?.finVisible || slot?.fin;
  const price = servicePriceValue(service);
  const balance = Math.max(0, price - RESERVATION_DEPOSIT_CLP);

  return (
    <Card className="summary-card">
      <span className="card-kicker">Resumen de reserva</span>
      <h3>Detalle antes de confirmar</h3>
      <dl className="booking-summary-grid">
        <div>
          <dt>Servicio</dt>
          <dd>{service?.nombre || service?.name || 'Pendiente'}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{serviceCategory(service)}</dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{staffName(staff)}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{date ? formatDate(`${date}T00:00:00`) : 'Pendiente'}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{formatTime(time)}{endTime ? ` - ${formatTime(endTime)}` : ''}</dd>
        </div>
        <div>
          <dt>Duracion</dt>
          <dd>{slot?.duracionServicioMin || service?.duracion_minutos || service?.duracion || 'Pendiente'} min</dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>{clientName(client)}</dd>
        </div>
        <div>
          <dt>Contacto</dt>
          <dd>{clientEmail(client)} · {clientPhone(client)}</dd>
        </div>
      </dl>
      <div className="booking-summary-total">
        <span>Valor del servicio <strong>{servicePrice(service)}</strong></span>
        <span>Abono WebPay simulado <strong>{formatCLP(RESERVATION_DEPOSIT_CLP)}</strong></span>
        <span>Saldo estimado <strong>{formatCLP(balance)}</strong></span>
      </div>
      <p className="booking-summary-note">Al confirmar se crea una reserva temporal y se agrega al carrito para finalizar el pago simulado.</p>
    </Card>
  );
}

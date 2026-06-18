import { Card } from '../ui/Card.jsx';

function isReservation(item) {
  return item?.type === 'reservation';
}

function isDateTimeLike(value) {
  return typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value));
}

function formatDate(value) {
  if (!value) return 'Fecha por confirmar';
  const date = isDateTimeLike(value) ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function professionalName(item) {
  const staff = item?.staff || {};
  return `${staff.nombre || ''} ${staff.apellidos || ''}`.trim()
    || staff.fullName
    || item?.professionalName
    || item?.staffName
    || 'Profesional por confirmar';
}

export function CheckoutSummary({ items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.price || item.precio || 0) * Number(item.quantity || 1), 0);

  return (
    <Card className="summary-card">
      <h3>Pago</h3>
      <div className="checkout-summary-list">
        {items.map((item) => (
          <div key={item.id} className="checkout-summary-line">
            <strong>{item.name || item.nombre} x {item.quantity || 1}</strong>
            {isReservation(item) ? (
              <span>
                {professionalName(item)} · {formatDate(item.date || item.startsAt)} · {formatTime(item.startsAt || item.time)} - {formatTime(item.endsAt)}
              </span>
            ) : (
              <span>Producto</span>
            )}
            <em>${Number(item.price || item.precio || 0).toLocaleString('es-CL')}</em>
          </div>
        ))}
      </div>
      <p>Total: ${total.toLocaleString('es-CL')}</p>
    </Card>
  );
}

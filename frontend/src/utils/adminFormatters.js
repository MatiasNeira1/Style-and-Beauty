import { formatCLP } from './priceUtils.js';

export { formatCLP };

export function formatCurrencyCLP(value = 0) {
  return formatCLP(value);
}

export function formatPercentage(value = 0) {
  const number = Number(value) || 0;
  return `${number > 0 ? '+' : ''}${number.toFixed(0)}%`;
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', options).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return 'Sin hora';
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function getStatusBadgeVariant(status = '') {
  const normalized = String(status).toUpperCase();
  if (['CONFIRMADA', 'APROBADO', 'PAGADO', 'COMPLETADO', 'FINALIZADA', 'EXITOSO'].includes(normalized)) return 'success';
  if (['PENDIENTE', 'PENDIENTE_PAGO', 'PROCESANDO'].includes(normalized)) return 'warning';
  if (['CANCELADA', 'RECHAZADA', 'EXPIRADA', 'FALLIDO'].includes(normalized)) return 'danger';
  if (['EN_ATENCION', 'ACTIVO', 'DISPONIBLE'].includes(normalized)) return 'info';
  return 'neutral';
}

export function getTrendVariant(value = 0) {
  if (Number(value) > 0) return 'positive';
  if (Number(value) < 0) return 'negative';
  return 'neutral';
}

export function fullName(person) {
  if (!person) return null;
  return `${person.nombre || ''} ${person.apellidos || ''}`.trim() || person.emailContacto || null;
}

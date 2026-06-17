export const BOOKING_MAX_ADVANCE_DAYS = 30;
export const RESERVATION_EXPIRATION_MINUTES = 15;

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date, days) {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function minBookingDate() {
  return startOfLocalDay(new Date());
}

export function maxBookingDate() {
  return addDays(minBookingDate(), BOOKING_MAX_ADVANCE_DAYS);
}

export function isBookingDateAllowed(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  if (!date) return false;
  return date >= minBookingDate() && date <= maxBookingDate();
}

export function assertBookingDateAllowed(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  if (!date) throw new Error('Selecciona una fecha valida para reservar.');
  if (date < minBookingDate()) throw new Error('No se pueden seleccionar fechas anteriores a hoy.');
  if (date > maxBookingDate()) throw new Error(`Solo puedes reservar hasta ${BOOKING_MAX_ADVANCE_DAYS} dias desde hoy.`);
  return true;
}

export const BOOKING_MAX_ADVANCE_DAYS = 30;
export const RESERVATION_EXPIRATION_MINUTES = 15;
export const SATURDAY_CLOSE_HOUR = 16;

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

export function isSundayDate(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  return Boolean(date) && date.getDay() === 0;
}

export function isSaturdayDate(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  return Boolean(date) && date.getDay() === 6;
}

export function isBookingDateAllowed(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  if (!date) return false;
  return date >= minBookingDate() && date <= maxBookingDate() && date.getDay() !== 0;
}

export function bookingDateRejectionMessage(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  if (!date) return 'Selecciona una fecha valida para reservar.';
  if (date < minBookingDate()) return 'No puedes reservar fechas anteriores a hoy.';
  if (date > maxBookingDate()) return `Solo puedes reservar hasta ${BOOKING_MAX_ADVANCE_DAYS} días de anticipación.`;
  if (date.getDay() === 0) return 'No atendemos los domingos.';
  return '';
}

function slotEndForBusinessRules(slot) {
  return slot?.finVisible || slot?.fin || slot?.finAtencion || slot?.endsAt || slot?.horaFin;
}

export function isSlotBookable(slot) {
  const start = slot?.inicio || slot?.startsAt || slot?.horaInicio;
  if (!start) return false;
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return false;
  const dateKey = formatLocalDate(date);
  if (!isBookingDateAllowed(dateKey)) return false;
  if (!isSaturdayDate(dateKey)) return true;

  const end = new Date(slotEndForBusinessRules(slot));
  if (Number.isNaN(end.getTime())) return false;
  return end.getHours() < SATURDAY_CLOSE_HOUR
    || (end.getHours() === SATURDAY_CLOSE_HOUR && end.getMinutes() === 0 && end.getSeconds() === 0);
}

export function filterBookableSlots(slots = []) {
  if (!Array.isArray(slots)) return [];
  return slots.filter(isSlotBookable);
}

export function assertBookingDateAllowed(value) {
  const date = value instanceof Date ? startOfLocalDay(value) : parseLocalDate(value);
  if (!date) throw new Error('Selecciona una fecha valida para reservar.');
  const message = bookingDateRejectionMessage(date);
  if (message) throw new Error(message);
  return true;
}

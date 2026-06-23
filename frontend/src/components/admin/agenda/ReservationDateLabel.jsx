import { parseLocalDate, startOfLocalDay } from '../../../utils/bookingDateRules.js';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-CL', { weekday: 'long' });
const DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' });

function toLocalDay(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return startOfLocalDay(value);
  }

  const rawValue = String(value);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? parseLocalDate(rawValue) : new Date(rawValue);
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return startOfLocalDay(parsed);
}

function startOfLocalWeek(date) {
  const start = startOfLocalDay(date);
  const weekday = start.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

function sameLocalDay(left, right) {
  return Boolean(left && right)
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function formatReservationDateLabel(value, referenceDate = new Date()) {
  const date = toLocalDay(value);
  if (!date) return 'Reserva sin fecha';

  const today = startOfLocalDay(referenceDate);
  if (sameLocalDay(date, today)) return 'Reserva de hoy';

  const weekStart = startOfLocalWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  if (date >= weekStart && date <= weekEnd) {
    return `Reserva de este ${WEEKDAY_FORMATTER.format(date)}`;
  }

  return DATE_FORMATTER.format(date);
}

export function ReservationDateLabel({ value }) {
  return (
    <span className="admin-reservation-date-label">
      {formatReservationDateLabel(value)}
    </span>
  );
}

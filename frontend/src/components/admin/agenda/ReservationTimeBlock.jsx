import { formatTime } from '../../../utils/adminFormatters.js';

export function ReservationTimeBlock({ start, end, durationMinutes }) {
  const duration = Number(durationMinutes);
  const hasDuration = Number.isFinite(duration) && duration > 0;

  return (
    <div className="admin-booking-time admin-reservation-time-block">
      <div className="admin-time-block-row">
        <span>Inicio</span>
        <strong>{formatTime(start)}</strong>
      </div>
      <div className="admin-time-block-row">
        <span>Termino</span>
        <strong>{formatTime(end)}</strong>
      </div>
      {hasDuration && <small className="admin-time-block-duration">{Math.round(duration)} min</small>}
    </div>
  );
}

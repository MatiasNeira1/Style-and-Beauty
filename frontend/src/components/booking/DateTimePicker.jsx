import { Input } from '../ui/Input.jsx';

function formatSlotTime(value) {
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function DateTimePicker({ date, time, slots = [], isLoading = false, onDateChange, onTimeChange }) {
  return (
    <div className="stack">
      <Input id="booking-date" label="Fecha preferida" type="date" value={date} onChange={(event) => onDateChange?.(event.target.value)} />
      {isLoading ? (
        <p className="admin-alert">Calculando disponibilidad...</p>
      ) : date && slots.length === 0 ? (
        <p className="admin-alert">No hay horarios disponibles para esta fecha.</p>
      ) : (
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.inicio}
              type="button"
              className={time === slot.inicio ? 'chip active' : 'chip'}
              onClick={() => onTimeChange?.(slot.inicio)}
            >
              {formatSlotTime(slot.inicio)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

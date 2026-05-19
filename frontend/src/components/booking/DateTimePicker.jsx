import { Input } from '../ui/Input.jsx';

export function DateTimePicker({ date, time, onDateChange, onTimeChange }) {
  return (
    <div className="form-grid">
      <Input id="booking-date" label="Fecha preferida" type="date" value={date} onChange={(event) => onDateChange?.(event.target.value)} />
      <Input id="booking-time" label="Hora preferida" type="time" value={time} onChange={(event) => onTimeChange?.(event.target.value)} />
    </div>
  );
}

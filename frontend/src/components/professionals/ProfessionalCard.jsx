import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SafeImage } from '../ui/SafeImage.jsx';
import { professionalTheme, statusTone } from '../../utils/professionalTheme.js';

function visibleAvailabilitySlots(days = [], compact = false) {
  const maxSlots = compact ? 2 : 3;
  const rows = [];
  let total = 0;

  days.forEach((day) => {
    if (total >= maxSlots) return;
    const horarios = Array.isArray(day?.horarios) ? day.horarios : [];
    const slots = horarios.slice(0, maxSlots - total).map((slot) => ({
      ...slot,
      fecha: day.fecha,
      label: day.label,
    }));
    if (slots.length > 0) {
      rows.push({ ...day, horarios: slots });
      total += slots.length;
    }
  });

  return rows;
}

function firstAvailabilitySlot(days = []) {
  for (const day of days) {
    const slot = Array.isArray(day?.horarios) ? day.horarios[0] : null;
    if (slot) return { ...slot, fecha: day.fecha, label: day.label };
  }
  return null;
}

export function ProfessionalCard({
  professional,
  compact = false,
  onViewProfile,
  availability,
  availabilityLoading = false,
  availabilityError = false,
  selectedSlot,
  onSelectAvailabilitySlot,
  onReserve,
}) {
  const theme = professionalTheme(professional.especialidad);
  const tone = statusTone(professional.estado);
  const color = professional.colorEspecialidad || theme.color;
  const availabilityDays = Array.isArray(availability?.dias) ? availability.dias : [];
  const visibleRows = visibleAvailabilitySlots(availabilityDays, compact);
  const firstSlot = firstAvailabilitySlot(availabilityDays);
  const fallbackHours = !availability && !availabilityLoading && !availabilityError
    ? (professional.proximasHoras || []).filter(Boolean).slice(0, compact ? 1 : 3)
    : [];
  const hasVisibleSlots = visibleRows.length > 0;
  const selectedSlotKey = selectedSlot?.inicio || '';

  return (
    <motion.article
      className={`professional-card ${compact ? 'compact' : ''}`}
      style={{ '--specialty-color': color, '--specialty-soft': theme.soft }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      layout
    >
      <div className="professional-card-glow" />
      <div className="professional-card-header">
        <div className="professional-card-media">
          <SafeImage src={professional.imageUrl || professional.fotoUrl} alt={professional.fullName} />
        </div>
        <span className={`professional-status ${tone}`}>{professional.estado}</span>
      </div>

      <div className="professional-card-body">
        <div className="professional-main">
          <span className="professional-specialty">{professional.especialidad}</span>
          <h3>{professional.fullName}</h3>
          {!compact && <p>{professional.descripcion || professional.cargo}</p>}
        </div>

        <div className="professional-meta">
          <span><MapPin size={14} /> {professional.sucursal}</span>
          {!compact && <span><Clock size={14} /> {professional.modalidad}</span>}
        </div>

        <div className="professional-hours" aria-label="Próximas horas disponibles">
          <strong>Próximas horas disponibles</strong>
          {availabilityLoading ? (
            <span className="next-hour-chip">Consultando horarios...</span>
          ) : availabilityError ? (
            <span className="next-hour-chip is-muted">No pudimos consultar horarios</span>
          ) : hasVisibleSlots ? (
            visibleRows.map((day) => (
              <div className="professional-day-hours" key={day.fecha}>
                <span className="professional-day-label">{day.label}</span>
                <div className="professional-hour-chip-row">
                  {day.horarios.map((slot) => {
                    const slotKey = slot.inicio || `${day.fecha}-${slot.horaInicio}`;
                    const selected = selectedSlotKey === slot.inicio;
                    return (
                      <button
                        type="button"
                        key={slotKey}
                        className={`professional-hour-chip ${selected ? 'is-selected' : ''}`}
                        onClick={() => onSelectAvailabilitySlot?.(professional, slot)}
                      >
                        {slot.horaInicio}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : fallbackHours.length > 0 ? (
            fallbackHours.map((hour) => <span key={hour} className="next-hour-chip">{hour}</span>)
          ) : (
            <span className="next-hour-chip is-muted">Sin horas próximas</span>
          )}
        </div>

        <div className="professional-actions">
          {!compact && (
            <button type="button" className="text-link" onClick={() => onViewProfile?.(professional)}>
              Ver perfil
            </button>
          )}
          {onReserve ? (
            <button
              type="button"
              className="professional-booking-link"
              onClick={() => onReserve(professional, selectedSlot || firstSlot)}
            >
              <CalendarDays size={15} /> Reservar hora
            </button>
          ) : (
            <Link to="/reservar" className="professional-booking-link">
              <CalendarDays size={15} /> Reservar hora
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

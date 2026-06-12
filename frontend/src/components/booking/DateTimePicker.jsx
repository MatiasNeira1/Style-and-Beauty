import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Moon, Sunrise, Sun } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function slotDate(value) {
  return new Date(value);
}

function formatSlotTime(value) {
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(slotDate(value));
}

function selectedDateLabel(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function blockForSlot(slot) {
  const hour = slotDate(slot.inicio).getHours();
  if (hour < 12) return 'Mañana';
  if (hour < 18) return 'Tarde';
  return 'Noche';
}

const BLOCKS = [
  { key: 'Mañana', label: 'Mañana', icon: Sunrise },
  { key: 'Tarde', label: 'Tarde', icon: Sun },
  { key: 'Noche', label: 'Noche', icon: Moon },
];

export function DateTimePicker({ date, time, slots = [], isLoading = false, error = '', onDateChange, onTimeChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = date ? new Date(`${date}T12:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const value = new Date(year, month, day);
      const normalized = new Date(value);
      normalized.setHours(0, 0, 0, 0);
      days.push({
        day,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isPast: normalized < today,
        isToday: normalized.getTime() === today.getTime(),
      });
    }

    return days;
  }, [currentMonth]);

  const slotsByBlock = useMemo(() => {
    return BLOCKS.map((block) => ({
      ...block,
      slots: slots.filter((slot) => blockForSlot(slot) === block.key),
    })).filter((block) => block.slots.length > 0);
  }, [slots]);

  const handlePrevMonth = () => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));

  return (
    <div className="datetime-picker">
      <Card className="calendar-card">
        <div className="calendar-header">
          <h3>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <div className="calendar-controls">
            <button type="button" onClick={handlePrevMonth} className="icon-link" aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={handleNextMonth} className="icon-link" aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} />;
            const isSelected = date === day.date;
            return (
              <button
                key={day.date}
                type="button"
                disabled={day.isPast}
                className={`calendar-day ${isSelected ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
                onClick={() => {
                  onDateChange?.(day.date);
                  onTimeChange?.('');
                }}
              >
                {day.day}
              </button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {date && (
          <motion.div
            key={date}
            className="availability-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="availability-title">
              <span className="card-kicker">Disponibilidad del staff</span>
              <h3><Clock size={20} /> {selectedDateLabel(date)}</h3>
            </div>

            {error ? (
              <p className="admin-alert">{error}</p>
            ) : isLoading ? (
              <p className="admin-alert">Calculando disponibilidad del profesional...</p>
            ) : slots.length === 0 ? (
              <p className="admin-alert">No hay horarios disponibles para este profesional en la fecha seleccionada.</p>
            ) : (
              <div className="stack">
                {slotsByBlock.map((block) => {
                  const Icon = block.icon;
                  return (
                    <div key={block.key} className="slot-block">
                      <h4><Icon size={16} /> {block.label}</h4>
                      <div className="slot-grid">
                        {block.slots.map((slot) => (
                          <button
                            key={slot.inicio}
                            type="button"
                            className={`slot-button ${time === slot.inicio ? 'active' : ''}`}
                            onClick={() => onTimeChange?.(slot.inicio)}
                            title={`Servicio hasta ${formatSlotTime(slot.finVisible || slot.fin)}`}
                          >
                            <span>{formatSlotTime(slot.inicio)}</span>
                            <small>{formatSlotTime(slot.finVisible || slot.fin)} fin</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

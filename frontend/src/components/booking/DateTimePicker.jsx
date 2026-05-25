import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Sun, Sunrise, Moon } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Mock time slots for demonstration
const TIME_SLOTS = ['09:00', '09:30', '10:00', '11:00', '12:30', '14:00', '15:30', '16:00', '17:30', '18:00', '19:00'];

const getSelectedDateString = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
};

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
export function DateTimePicker({ date, time, onDateChange, onTimeChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = date ? new Date(date + 'T12:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateString,
        isPast: d.setHours(0,0,0,0) < new Date().setHours(0,0,0,0),
        isToday: d.setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
      });
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const timeBlocks = useMemo(() => {
    return [
      { label: 'Mañana', icon: Sunrise, times: TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) < 12) },
      { label: 'Tarde', icon: Sun, times: TIME_SLOTS.filter(t => { const h = parseInt(t.split(':')[0]); return h >= 12 && h < 18; }) },
      { label: 'Noche', icon: Moon, times: TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) >= 18) }
    ].filter(block => block.times.length > 0);
  }, []);

  return (
    <div className="datetime-picker" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrevMonth} className="icon-link" style={{ height: '2.2rem', width: '2.2rem' }} aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleNextMonth} className="icon-link" style={{ height: '2.2rem', width: '2.2rem' }} aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ color: 'var(--color-muted)', fontSize: '0.85rem', fontWeight: 600, paddingBottom: '0.5rem' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {calendarDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            
            const isSelected = date === d.date;
            
            return (
              <button
                key={d.date}
                disabled={d.isPast}
                onClick={() => {
                  onDateChange?.(d.date);
                  onTimeChange?.(''); 
                }}
                style={{
                  aspectRatio: '1',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  cursor: d.isPast ? 'not-allowed' : 'pointer',
                  opacity: d.isPast ? 0.25 : 1,
                  background: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? '#fff' : d.isToday ? 'var(--color-champagne)' : 'var(--color-ink)',
                  border: d.isToday && !isSelected ? '1px solid var(--color-champagne)' : '1px solid transparent',
                  fontWeight: isSelected || d.isToday ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!d.isPast && !isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!d.isPast && !isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {d.day}
              </button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {date && (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-line)', paddingBottom: '1rem' }}>
              <span className="card-kicker" style={{ display: 'block', marginBottom: '0.3rem' }}>Disponibilidad</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--color-primary)" />
                {getSelectedDateString(date)}
              </h3>
            </div>

            <div className="stack" style={{ gap: '1.5rem' }}>
              {timeBlocks.map((block, i) => {
                const Icon = block.icon;
                return (
                  <motion.div 
                    key={block.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-ink-soft)', fontSize: '0.95rem', marginBottom: '0.8rem' }}>
                      <Icon size={16} /> {block.label}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.8rem' }}>
                      {block.times.map(t => (
                        <button
                          key={t}
                          onClick={() => onTimeChange?.(t)}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: time === t ? 'var(--color-primary)' : 'var(--glass-border)',
                            background: time === t ? 'rgba(196,70,126,0.15)' : 'var(--color-surface-glass)',
                            color: time === t ? '#fff' : 'var(--color-ink)',
                            cursor: 'pointer',
                            fontWeight: time === t ? 700 : 500,
                            transition: 'all 0.25s',
                            textAlign: 'center',
                            boxShadow: time === t ? 'var(--shadow-glow-primary)' : 'none',
                            backdropFilter: 'blur(12px)'
                          }}
                          onMouseEnter={(e) => {
                            if (time !== t) {
                              e.currentTarget.style.borderColor = 'var(--color-line-hover)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (time !== t) {
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

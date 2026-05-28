import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';

const DAYS = [
  { key: 0, label: 'Lunes' },
  { key: 1, label: 'Martes' },
  { key: 2, label: 'Miércoles' },
  { key: 3, label: 'Jueves' },
  { key: 4, label: 'Viernes' },
  { key: 5, label: 'Sábado' },
  { key: 6, label: 'Domingo' },
];

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

function buildDefaultSchedule() {
  return DAYS.map((d) => ({
    diaSemana: d.key,
    horaInicio: DEFAULT_START,
    horaFin: DEFAULT_END,
    activo: d.key < 5, // Lunes a viernes activo por defecto
  }));
}

export function StaffWorkSchedule({ schedules = [], onSave, isSaving }) {
  const [localSchedule, setLocalSchedule] = useState(buildDefaultSchedule);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (schedules.length > 0) {
      const merged = DAYS.map((d) => {
        const existing = schedules.find((s) => s.diaSemana === d.key);
        return existing
          ? {
              diaSemana: d.key,
              horaInicio: existing.horaInicio || DEFAULT_START,
              horaFin: existing.horaFin || DEFAULT_END,
              activo: existing.activo ?? true,
            }
          : {
              diaSemana: d.key,
              horaInicio: DEFAULT_START,
              horaFin: DEFAULT_END,
              activo: false,
            };
      });
      setLocalSchedule(merged);
    }
  }, [schedules]);

  const handleChange = (dayKey, field, value) => {
    setLocalSchedule((prev) =>
      prev.map((s) => (s.diaSemana === dayKey ? { ...s, [field]: value } : s))
    );

    // Clear error for the day
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[dayKey];
      return next;
    });
  };

  const handleToggle = (dayKey) => {
    setLocalSchedule((prev) =>
      prev.map((s) => (s.diaSemana === dayKey ? { ...s, activo: !s.activo } : s))
    );
  };

  const validate = () => {
    const errors = {};
    localSchedule.forEach((day) => {
      if (day.activo && day.horaInicio >= day.horaFin) {
        errors[day.diaSemana] = 'La hora de inicio debe ser anterior a la hora de fin';
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(localSchedule);
    }
  };

  return (
    <div className="card stack">
      <div className="staff-form-section-title">
        <Clock size={14} />
        Jornada Laboral Fija
      </div>

      <div className="schedule-grid">
        {localSchedule.map((day) => {
          const dayInfo = DAYS.find((d) => d.key === day.diaSemana);
          const error = validationErrors[day.diaSemana];

          return (
            <div key={day.diaSemana}>
              <div className={`schedule-day ${!day.activo ? 'inactive' : ''}`}>
                <span className="schedule-day-name">{dayInfo?.label}</span>
                <input
                  type="time"
                  className="schedule-time-input"
                  value={day.horaInicio}
                  onChange={(e) => handleChange(day.diaSemana, 'horaInicio', e.target.value)}
                  disabled={!day.activo}
                  aria-label={`Hora inicio ${dayInfo?.label}`}
                />
                <input
                  type="time"
                  className="schedule-time-input"
                  value={day.horaFin}
                  onChange={(e) => handleChange(day.diaSemana, 'horaFin', e.target.value)}
                  disabled={!day.activo}
                  aria-label={`Hora fin ${dayInfo?.label}`}
                />
                <input
                  type="checkbox"
                  className="schedule-toggle"
                  checked={day.activo}
                  onChange={() => handleToggle(day.diaSemana)}
                  aria-label={`Activar ${dayInfo?.label}`}
                />
              </div>
              {error && (
                <small style={{ color: '#dc2626', fontSize: '0.78rem', paddingLeft: '1rem' }}>
                  {error}
                </small>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          <Save size={14} />
          {isSaving ? 'Guardando...' : 'Guardar jornada'}
        </Button>
      </div>
    </div>
  );
}

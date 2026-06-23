import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  bookingDateRejectionMessage,
  formatLocalDate,
  parseLocalDate,
  startOfLocalDay,
} from '../../../utils/bookingDateRules.js';

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

function formatDisplayDate(date) {
  if (!date) return '';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function sameLocalDay(left, right) {
  return Boolean(left && right)
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarGridStart(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const weekday = start.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

function monthCells(monthDate) {
  const start = calendarGridStart(monthDate);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function AdminDatePicker({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder = 'dd/mm/aaaa',
  allowClear = false,
  enforceBookingRules = true,
}) {
  const wrapperRef = useRef(null);
  const selectedDate = useMemo(() => parseLocalDate(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = selectedDate || startOfLocalDay(new Date());
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const days = useMemo(() => monthCells(visibleMonth), [visibleMonth]);
  const displayValue = selectedDate ? formatDisplayDate(selectedDate) : '';
  const helperText = localError || hint;

  const validateDate = (date) => {
    if (!enforceBookingRules) return '';
    return bookingDateRejectionMessage(formatLocalDate(date));
  };

  const selectDate = (date) => {
    const rejectionMessage = validateDate(date);
    if (rejectionMessage) {
      setLocalError(rejectionMessage);
      return;
    }

    onChange(formatLocalDate(date));
    setLocalError('');
    setIsOpen(false);
  };

  return (
    <div className="field admin-date-picker" ref={wrapperRef}>
      <span>{label}</span>
      <div className="admin-date-picker-control">
        <button
          id={id}
          type="button"
          className={`admin-date-picker-trigger ${displayValue ? 'has-value' : ''}`}
          onClick={() => {
            setLocalError('');
            setIsOpen((current) => !current);
          }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <CalendarDays size={16} />
          <span>{displayValue || placeholder}</span>
        </button>
        {allowClear && value && (
          <button
            type="button"
            className="admin-date-picker-clear"
            aria-label={`Limpiar ${label.toLowerCase()}`}
            onClick={() => {
              onChange('');
              setLocalError('');
              setIsOpen(false);
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {helperText && <small className={localError ? 'field-error' : undefined}>{helperText}</small>}

      {isOpen && (
        <div className="admin-date-picker-panel" role="dialog" aria-label={label}>
          <div className="admin-date-picker-nav">
            <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, -1))} aria-label="Mes anterior">
              <ChevronLeft size={17} />
            </button>
            <strong>{MONTH_FORMATTER.format(visibleMonth)}</strong>
            <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))} aria-label="Mes siguiente">
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="admin-date-picker-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="admin-date-picker-grid">
            {days.map((day) => {
              const key = formatLocalDate(day);
              const rejectionMessage = validateDate(day);
              const isDisabled = Boolean(rejectionMessage);
              const isSelected = sameLocalDay(day, selectedDate);
              const isToday = sameLocalDay(day, today);
              const isOutside = day.getMonth() !== visibleMonth.getMonth();

              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'admin-date-picker-day',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                    isOutside ? 'is-outside' : '',
                    isDisabled ? 'is-disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDate(day)}
                  aria-disabled={isDisabled}
                  title={rejectionMessage || formatDisplayDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

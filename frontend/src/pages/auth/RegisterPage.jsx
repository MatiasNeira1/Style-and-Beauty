import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
  UsersRound,
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const initialForm = {
  rut: '',
  nombre: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  telefono: '',
  emailContacto: '',
  password: '',
};

const genderOptions = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'otro', label: 'Otro' },
  { value: 'no_especifica', label: 'Prefiero no decirlo' },
];

const benefits = [
  'Reserva tus tratamientos favoritos',
  'Gestiona tus horas fácilmente',
  'Accede a promociones exclusivas',
];

const stats = [
  { value: '+10.000', label: 'clientas felices' },
  { value: '24/7', label: 'reservas online' },
  { value: 'Premium', label: 'experiencia beauty' },
];

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const weekdayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const firebaseErrorMessages = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const portalMotionProps = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

const getTodayIsoDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

const getMaxBirthDateIso = () => {
  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
  return toIsoDate(maxBirthDate);
};

const toIsoDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const isSameDay = (date, isoDate) => isoDate && toIsoDate(date) === isoDate;

const isValidGender = (value) => genderOptions.some((option) => option.value === value);

const calculateAge = (isoDate) => {
  const birthDate = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthday) age -= 1;
  return age;
};

const getCalendarDays = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      iso: toIsoDate(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

const getRegisterErrorMessage = (registerError) => {
  if (firebaseErrorMessages[registerError.code]) {
    return firebaseErrorMessages[registerError.code];
  }

  const message = registerError.message || '';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('network') || normalizedMessage.includes('conectar')) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté iniciado.';
  }

  if (normalizedMessage.includes('correo') || normalizedMessage.includes('email')) {
    return normalizedMessage.includes('existe') || normalizedMessage.includes('registrado')
      ? 'Este email ya está registrado.'
      : message;
  }

  if (normalizedMessage.includes('obligatorio') || normalizedMessage.includes('requerido')) {
    return 'Completa todos los campos obligatorios.';
  }

  return message || 'No se pudo crear la cuenta.';
};

function useFloatingOverlay({ isOpen, onClose, preferredWidth = 320, estimatedHeight = 360 }) {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [floatingStyle, setFloatingStyle] = useState({});
  const [isMobileSheet, setIsMobileSheet] = useState(false);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth <= 480;
    setIsMobileSheet(isMobile);

    if (isMobile) {
      setFloatingStyle({});
      return;
    }

    const width = Math.max(rect.width, preferredWidth);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.min(Math.max(16, rect.left), viewportWidth - width - 16);
    const bottomTop = rect.bottom + 10;
    const top = bottomTop + estimatedHeight > viewportHeight - 16
      ? Math.max(16, rect.top - estimatedHeight - 10)
      : bottomTop;

    setFloatingStyle({
      left,
      top,
      width,
    });
  }, [estimatedHeight, preferredWidth]);

  useEffect(() => {
    if (!isOpen) return undefined;

    updatePosition();

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        popoverRef.current?.contains(event.target)
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, updatePosition]);

  return { triggerRef, popoverRef, floatingStyle, isMobileSheet };
}

function FloatingPortal({ children, className, floatingStyle, isMobileSheet, popoverRef, ...props }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      className={`${className} ${isMobileSheet ? 'is-mobile-sheet' : ''}`.trim()}
      style={isMobileSheet ? undefined : floatingStyle}
      {...portalMotionProps}
      {...props}
    >
      {children}
    </motion.div>,
    document.body,
  );
}

function PremiumField({ icon: Icon, label, id, className = '', trailing, ...props }) {
  return (
    <motion.label className={`register-field ${className}`.trim()} htmlFor={id} variants={itemVariants}>
      <span>{label}</span>
      <div className="register-input-shell">
        <Icon aria-hidden="true" size={18} />
        <input id={id} {...props} />
        {trailing}
      </div>
    </motion.label>
  );
}

function PremiumDatePicker({ value, onChange, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const closePicker = useCallback(() => {
    setIsOpen(false);
    setIsYearPickerOpen(false);
  }, []);
  const { triggerRef, popoverRef, floatingStyle, isMobileSheet } = useFloatingOverlay({
    isOpen,
    onClose: closePicker,
    preferredWidth: 340,
    estimatedHeight: 430,
  });
  const selectedDate = parseIsoDate(value);
  const maxDateObject = parseIsoDate(maxDate);
  const [viewDate, setViewDate] = useState(selectedDate || new Date(maxDateObject.getFullYear() - 24, 0, 1));
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const years = useMemo(() => {
    const maxYear = maxDateObject.getFullYear();
    return Array.from({ length: 101 }, (_, index) => maxYear - index);
  }, [maxDateObject]);

  const canGoNext = viewDate.getFullYear() < maxDateObject.getFullYear() || viewDate.getMonth() < maxDateObject.getMonth();

  const moveMonth = (direction) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setIsYearPickerOpen(false);
  };

  const selectYear = (year) => {
    const nextMonth = year === maxDateObject.getFullYear() ? Math.min(viewDate.getMonth(), maxDateObject.getMonth()) : viewDate.getMonth();
    setViewDate(new Date(year, nextMonth, 1));
    setIsYearPickerOpen(false);
  };

  const selectDate = (date) => {
    const isoDate = toIsoDate(date);
    if (isoDate > maxDate) return;
    onChange(isoDate);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    closePicker();
  };

  return (
    <motion.div className="register-field custom-picker-field" variants={itemVariants}>
      <span>Fecha nacimiento</span>
      <button
        ref={triggerRef}
        className={`register-input-shell register-input-trigger ${isOpen ? 'is-open' : ''}`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarDays aria-hidden="true" size={18} />
        <span className={value ? 'trigger-value' : 'trigger-placeholder'}>
          {value ? formatDisplayDate(value) : 'Selecciona tu fecha de nacimiento'}
        </span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>

      {isOpen && (
        <FloatingPortal
          className="premium-picker-popover premium-date-popover"
          floatingStyle={floatingStyle}
          isMobileSheet={isMobileSheet}
          popoverRef={popoverRef}
          role="dialog"
          aria-label="Seleccionar fecha de nacimiento"
        >
          <div className="premium-picker-mobile-handle" />
          <div className="date-picker-header">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="date-picker-title" type="button" onClick={() => setIsYearPickerOpen((current) => !current)}>
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              <ChevronDown size={16} />
            </button>
            <button type="button" onClick={() => moveMonth(1)} disabled={!canGoNext} aria-label="Mes siguiente">
              <ChevronRight size={18} />
            </button>
          </div>

          {isYearPickerOpen ? (
            <div className="year-picker-grid">
              {years.map((year) => (
                <button
                  className={year === viewDate.getFullYear() ? 'is-selected' : ''}
                  key={year}
                  type="button"
                  onClick={() => selectYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="weekday-grid">
                {weekdayNames.map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="day-picker-grid">
                {calendarDays.map(({ date, iso, isCurrentMonth }) => {
                  const isDisabled = iso > maxDate;
                  return (
                    <button
                      className={[
                        !isCurrentMonth ? 'is-muted' : '',
                        isSameDay(date, value) ? 'is-selected' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={isDisabled}
                      key={iso}
                      type="button"
                      onClick={() => selectDate(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <p className="picker-helper">Edad mínima: 15 años.</p>
        </FloatingPortal>
      )}
    </motion.div>
  );
}

function PremiumGenderSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeSelect = useCallback(() => setIsOpen(false), []);
  const { triggerRef, popoverRef, floatingStyle, isMobileSheet } = useFloatingOverlay({
    isOpen,
    onClose: closeSelect,
    preferredWidth: 260,
    estimatedHeight: 230,
  });
  const selectedOption = genderOptions.find((option) => option.value === value);

  const selectOption = (optionValue) => {
    onChange(optionValue);
    closeSelect();
  };

  return (
    <motion.div className="register-field custom-picker-field" variants={itemVariants}>
      <span>Género</span>
      <button
        ref={triggerRef}
        className={`register-input-shell register-input-trigger ${isOpen ? 'is-open' : ''}`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <UsersRound aria-hidden="true" size={18} />
        <span className={selectedOption ? 'trigger-value' : 'trigger-placeholder'}>
          {selectedOption ? selectedOption.label : 'Selecciona tu género'}
        </span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>

      {isOpen && (
        <FloatingPortal
          className="premium-picker-popover premium-select-popover"
          floatingStyle={floatingStyle}
          isMobileSheet={isMobileSheet}
          popoverRef={popoverRef}
          role="listbox"
        >
          <div className="premium-picker-mobile-handle" />
          {genderOptions.map((option) => (
            <button
              className={option.value === value ? 'is-selected' : ''}
              key={option.value}
              type="button"
              onClick={() => selectOption(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={17} />}
            </button>
          ))}
        </FloatingPortal>
      )}
    </motion.div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerClient } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const maxBirthDate = getMaxBirthDateIso();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateFormValue = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.rut || !form.nombre || !form.emailContacto || !form.password || !form.fechaNacimiento || !form.genero) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    if (!isValidGender(form.genero)) {
      setError('Selecciona una opción válida para género.');
      return;
    }

    if (form.fechaNacimiento > getTodayIsoDate()) {
      setError('La fecha de nacimiento no puede ser futura.');
      return;
    }

    if (calculateAge(form.fechaNacimiento) < 15) {
      setError('Debes tener al menos 15 años para crear una cuenta.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { password, ...profile } = {
        ...form,
        genero: form.genero.trim().toLowerCase(),
      };

      await registerClient({
        email: form.emailContacto,
        password,
        profile,
      });
      const redirectTo = location.state?.from?.pathname || '/perfil';
      const redirectState = location.state?.from?.state;
      navigate(redirectTo, { replace: true, state: redirectState });
    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-experience">
      <div className="register-ambient register-ambient-one" />
      <div className="register-ambient register-ambient-two" />

      <section className="register-shell" aria-labelledby="register-title">
        <motion.aside
          className="register-hero-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="register-hero-media" />
          <div className="register-hero-overlay" />
          <motion.div
            className="register-floating register-floating-top"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={18} />
            Ritual beauty personalizado
          </motion.div>
          <motion.div
            className="register-floating register-floating-bottom"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart size={18} />
            Tu experiencia beauty comienza aquí
          </motion.div>

          <div className="register-hero-content">
            <span className="register-eyebrow">Style & Beauty Club</span>
            <h2>Bienestar, belleza y reservas en un solo lugar.</h2>
            <p>
              Crea tu perfil para organizar tus sesiones, recibir beneficios exclusivos y vivir una experiencia de estética premium.
            </p>

            <div className="register-benefits">
              {benefits.map((benefit) => (
                <span key={benefit}>
                  <CheckCircle2 size={16} />
                  {benefit}
                </span>
              ))}
            </div>

            <div className="register-stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <motion.section
          className="register-form-panel"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-labelledby="register-title"
        >
          <motion.div className="register-heading" variants={itemVariants}>
            <span className="register-eyebrow">Nueva cuenta</span>
            <h1 id="register-title">
              Comienza tu experiencia <span>Style & Beauty</span>
            </h1>
            <div className="register-shine" aria-hidden="true" />
            <p>
              Accede a tus reservas, promociones y tratamientos favoritos desde un perfil creado para tu bienestar.
            </p>
          </motion.div>

          <motion.form className="register-form-card" onSubmit={handleSubmit} variants={itemVariants}>
            <motion.div className="register-form-grid" variants={containerVariants}>
              <PremiumField
                icon={User}
                label="RUT"
                id="register-rut"
                name="rut"
                value={form.rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                required
              />
              <PremiumField
                icon={User}
                label="Nombre"
                id="register-nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
              />
              <PremiumField
                icon={User}
                label="Apellidos"
                id="register-apellidos"
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                placeholder="Tus apellidos"
              />
              <PremiumField
                icon={Mail}
                label="Email"
                id="register-email"
                name="emailContacto"
                type="email"
                value={form.emailContacto}
                onChange={handleChange}
                placeholder="tuemail@correo.com"
                required
              />
              <PremiumField
                icon={Lock}
                label="Contraseña"
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                minLength="6"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                trailing={
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              <PremiumField
                icon={Phone}
                label="Teléfono"
                id="register-telefono"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
              <PremiumDatePicker
                value={form.fechaNacimiento}
                maxDate={maxBirthDate}
                onChange={(value) => updateFormValue('fechaNacimiento', value)}
              />
              <PremiumGenderSelect
                value={form.genero}
                onChange={(value) => updateFormValue('genero', value)}
              />
            </motion.div>

            {error && (
              <motion.p className="admin-alert register-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.p>
            )}

            <Button className="register-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear mi espacio beauty'}
            </Button>

            <p className="register-login-note">
              ¿Ya tienes cuenta? <NavLink className="text-link" to="/login">Inicia sesión</NavLink>
            </p>
          </motion.form>
        </motion.section>
      </section>
    </main>
  );
}

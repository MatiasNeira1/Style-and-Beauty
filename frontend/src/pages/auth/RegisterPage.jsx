import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronDown,
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
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { authService } from '../../services/authService.js';
import { formatRut, normalizeRut, validateRut } from '../../utils/rutUtils.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const CHILE_PHONE_REGEX = /^\+56\s?9\s?\d{4}\s?\d{4}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:"<>?|[\]\\;',./`~-]).{8,}$/;

const initialForm = {
  rut: '',
  nombre: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  telefono: '+56 ',
  emailContacto: '',
  password: '',
  confirmPassword: '',
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

  if (normalizedMessage.includes('rol') || normalizedMessage.includes('role') || normalizedMessage.includes('claim')) {
    return 'No se pudo completar la creación de tu perfil. Intenta nuevamente.';
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

function BirthDateSelects({ value, onChange, maxDate, style }) {
  const selectedDate = parseIsoDate(value);
  const maxDateObject = parseIsoDate(maxDate);
  const maxYear = maxDateObject.getFullYear();
  const maxMonth = maxDateObject.getMonth() + 1;
  const maxDay = maxDateObject.getDate();
  const [year, setYear] = useState(selectedDate ? String(selectedDate.getFullYear()) : '');
  const [month, setMonth] = useState(selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '');
  const [day, setDay] = useState(selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : '');

  const years = useMemo(() => Array.from({ length: 101 }, (_, index) => String(maxYear - index)), [maxYear]);
  const monthOptions = useMemo(() => {
    const selectedYear = Number(year);
    const limit = selectedYear === maxYear ? maxMonth : 12;
    return monthNames.slice(0, limit).map((label, index) => ({
      label,
      value: String(index + 1).padStart(2, '0'),
    }));
  }, [maxMonth, maxYear, year]);
  const dayOptions = useMemo(() => {
    if (!year || !month) return [];
    const selectedYear = Number(year);
    const selectedMonth = Number(month);
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const limit = selectedYear === maxYear && selectedMonth === maxMonth ? maxDay : daysInMonth;
    return Array.from({ length: limit }, (_, index) => String(index + 1).padStart(2, '0'));
  }, [maxDay, maxMonth, maxYear, month, year]);

  const handleYearChange = (event) => {
    setYear(event.target.value);
    setMonth('');
    setDay('');
    onChange('');
  };

  const handleMonthChange = (event) => {
    setMonth(event.target.value);
    setDay('');
    onChange('');
  };

  const handleDayChange = (event) => {
    const selectedDay = event.target.value;
    setDay(selectedDay);
    if (!year || !month || !selectedDay) {
      onChange('');
      return;
    }

    const isoDate = `${year}-${month}-${selectedDay}`;
    onChange(isoDate <= maxDate ? isoDate : '');
  };

  return (
    <motion.div className="register-field birthdate-field" variants={itemVariants} style={style}>
      <span>Fecha nacimiento</span>
      <div className="birthdate-select-grid">
        <select aria-label="Año de nacimiento" value={year} onChange={handleYearChange} required>
          <option value="">Año</option>
          {years.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
        </select>
        <select aria-label="Mes de nacimiento" value={month} onChange={handleMonthChange} disabled={!year} required>
          <option value="">Mes</option>
          {monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Día de nacimiento" value={day} onChange={handleDayChange} disabled={!year || !month} required>
          <option value="">Día</option>
          {dayOptions.map((dayOption) => <option key={dayOption} value={dayOption}>{dayOption}</option>)}
        </select>
      </div>
      <small>Edad mínima: 15 años.</small>
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
  const [form, setForm] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem('style_beauty_pending_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          rut: parsed.rut || '',
          nombre: parsed.nombre || '',
          apellidos: parsed.apellidos || '',
          fechaNacimiento: parsed.fechaNacimiento || '',
          genero: parsed.genero || '',
          telefono: parsed.telefono || '+56 ',
          emailContacto: parsed.emailContacto || '',
          password: '',
          confirmPassword: '',
        };
      }
    } catch {
      // ignore
    }
    return initialForm;
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const maxBirthDate = getMaxBirthDateIso();



  const handleChange = (event) => {
    const { name, value } = event.target;
    const finalValue = name === 'rut' ? formatRut(value) : value;
    setForm((current) => ({ ...current, [name]: finalValue }));
  };

  const handlePhoneChange = (event) => {
    let { value } = event.target;
    
    if (!value.startsWith('+56')) {
      value = '+56 ' + value.replace(/^\+?(56)?/, '').trimStart();
    }
    
    let cleanValue = value.replace(/[^0-9+\s]/g, '');
    const digitsOnly = cleanValue.replace(/[^\d]/g, '');
    if (digitsOnly.length > 11) {
      let digitCount = 0;
      let truncated = '';
      for (let i = 0; i < cleanValue.length; i++) {
        const char = cleanValue[i];
        if (/\d/.test(char)) {
          if (digitCount < 11) {
            truncated += char;
            digitCount++;
          }
        } else {
          truncated += char;
        }
      }
      cleanValue = truncated;
    }
    if (cleanValue.length > 15) {
      cleanValue = cleanValue.slice(0, 15);
    }
    updateFormValue('telefono', cleanValue);
  };

  const updateFormValue = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const isFormInvalid = useMemo(() => {
    return (
      !form.rut ||
      !form.nombre ||
      !form.emailContacto ||
      !form.password ||
      !form.confirmPassword ||
      !form.fechaNacimiento ||
      !form.genero ||
      !form.telefono ||
      !validateRut(form.rut) ||
      !CHILE_PHONE_REGEX.test(form.telefono) ||
      !PASSWORD_REGEX.test(form.password) ||
      form.password !== form.confirmPassword
    );
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.rut) {
      setError('El RUT es obligatorio.');
      return;
    }

    if (!validateRut(form.rut)) {
      setError('Ingresa un RUT válido.');
      return;
    }

    if (!form.nombre || !form.emailContacto || !form.password || !form.fechaNacimiento || !form.genero || !form.telefono) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    if (!EMAIL_REGEX.test(form.emailContacto)) {
      setError('El formato del email no es válido.');
      return;
    }

    if (!CHILE_PHONE_REGEX.test(form.telefono)) {
      setError('El formato del teléfono no es válido (ej: +56 9 1234 5678).');
      return;
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      setError('La contraseña debe tener entre 8 y 15 caracteres, incluir una mayúscula, un número y un símbolo especial.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
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
      const { password, confirmPassword, ...profile } = {
        ...form,
        rut: normalizeRut(form.rut),
        genero: form.genero.trim().toLowerCase(),
      };

      // 1. Create account in Firebase Auth, send verification, sign out
      await authService.registerUserWithVerification(profile, password);

      // 2. Store profile data temporarily in sessionStorage (NO Firestore write)
      window.sessionStorage.setItem('style_beauty_pending_profile', JSON.stringify(profile));

      // 3. Navigate to verification pending page
      navigate('/verificacion-pendiente', { replace: true });

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
          <>
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
                    onBlur={() => updateFormValue('rut', formatRut(form.rut))}
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
                    maxLength={20}
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
                    maxLength={20}
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
                    maxLength={25}
                    required
                  />
                  <PremiumField
                    icon={Phone}
                    label="Teléfono"
                    id="register-telefono"
                    name="telefono"
                    value={form.telefono}
                    onChange={handlePhoneChange}
                    placeholder="+56 9 1234 5678"
                  />
                  <PremiumGenderSelect
                    value={form.genero}
                    onChange={(value) => updateFormValue('genero', value)}
                  />
                  <BirthDateSelects
                    value={form.fechaNacimiento}
                    maxDate={maxBirthDate}
                    onChange={(value) => updateFormValue('fechaNacimiento', value)}
                    style={{ gridColumn: '1 / -1' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <PremiumField
                      icon={Lock}
                      label="Contraseña"
                      id="register-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      minLength="8"
                      maxLength="15"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Crea una contraseña segura"
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                      <span style={{ color: form.password.length >= 8 && form.password.length <= 15 ? 'var(--color-primary-strong)' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Entre 8 y 15 caracteres
                      </span>
                      <span style={{ color: /[A-Z]/.test(form.password) ? 'var(--color-primary-strong)' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Al menos 1 letra mayúscula
                      </span>
                      <span style={{ color: /\d/.test(form.password) ? 'var(--color-primary-strong)' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Al menos 1 número
                      </span>
                      <span style={{ color: /[!@#$%^&*()_+{}:"<>?|[\]\\;',./`~-]/.test(form.password) ? 'var(--color-primary-strong)' : 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Al menos 1 símbolo especial
                      </span>
                    </div>
                  </div>
                  <PremiumField
                    icon={Lock}
                    label="Confirmar contraseña"
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    minLength="8"
                    maxLength="15"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                    trailing={
                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                </motion.div>
 
                {error && (
                  <motion.p className="admin-alert register-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    {error}
                  </motion.p>
                )}
 
                <Button className="register-submit" type="submit" disabled={isSubmitting || isFormInvalid}>
                  {isSubmitting ? 'Creando cuenta...' : 'Crear mi espacio beauty'}
                </Button>

                <p className="register-login-note">
                  ¿Ya tienes cuenta? <NavLink className="text-link" to="/login">Inicia sesión</NavLink>
                </p>
              </motion.form>
            </>
        </motion.section>
      </section>
    </main>
  );
}

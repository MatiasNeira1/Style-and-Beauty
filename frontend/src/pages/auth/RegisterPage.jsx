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
  MailCheck,
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { authService } from '../../services/authService.js';

function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  let calculatedDv = '';
  if (expectedDv === 11) {
    calculatedDv = '0';
  } else if (expectedDv === 10) {
    calculatedDv = 'K';
  } else {
    calculatedDv = String(expectedDv);
  }

  return calculatedDv === dv;
}

function formatRut(value) {
  if (!value) return '';
  let clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  clean = clean.slice(0, 9);

  if (clean.length <= 1) {
    return clean;
  }

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  let formattedBody = '';
  if (body.length <= 3) {
    formattedBody = body;
  } else if (body.length <= 6) {
    formattedBody = body.slice(0, body.length - 3) + '.' + body.slice(body.length - 3);
  } else {
    formattedBody = body.slice(0, body.length - 6) + '.' + body.slice(body.length - 6, body.length - 3) + '.' + body.slice(body.length - 3);
  }

  return formattedBody + '-' + dv;
}

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

function BirthDateSelects({ value, onChange, maxDate }) {
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
    <motion.div className="register-field birthdate-field" variants={itemVariants}>
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
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const maxBirthDate = getMaxBirthDateIso();

  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const finalValue = name === 'rut' ? formatRut(value) : value;
    setForm((current) => ({ ...current, [name]: finalValue }));
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

    if (!validateRut(form.rut)) {
      setError('El RUT no es válido (ej: 12.345.678-9).');
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

      // 1. Guardar en Auth y Firestore simultáneamente, y enviar correo
      const user = await authService.registerUserWithVerification(profile, password);

      setPendingUser(user);
      setIsVerificationSent(true);

    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!pendingUser) return;
    setIsVerifying(true);
    setError('');

    try {
      await pendingUser.reload();
      if (!pendingUser.emailVerified) {
        setError('Aún no hemos detectado la verificación. Revisa tu bandeja de entrada o spam.');
        setIsVerifying(false);
        return;
      }

      const redirectTo = location.state?.from?.pathname || '/perfil';
      const redirectState = location.state?.from?.state;
      navigate(redirectTo, { replace: true, state: redirectState });
    } catch (err) {
      if (err.message.includes('verificado')) {
        setError('Aún no hemos detectado la verificación. Revisa tu bandeja de entrada o spam.');
      } else {
        setError('Error conectando con la base de datos. Intenta nuevamente.');
      }
    } finally {
      setIsVerifying(false);
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
          {!isVerificationSent ? (
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
                  <BirthDateSelects
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
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="register-form-card"
              style={{ textAlign: 'center', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <MailCheck size={64} color="var(--color-primary-strong)" style={{ margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-ink)' }}>Revisa tu correo electrónico</h2>
              <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
                Hemos enviado un enlace de confirmación a <strong>{form.emailContacto}</strong>.<br />
                Haz clic en el enlace para validar tu cuenta y poder ingresar.
              </p>

              {error && (
                <p className="admin-alert register-error" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left' }}>
                  {error}
                </p>
              )}

              <Button
                onClick={handleVerifyEmail}
                disabled={isVerifying}
                style={{ width: '100%', marginBottom: '1rem', padding: '1rem' }}
              >
                {isVerifying ? 'Verificando estado...' : 'Ya verifiqué mi correo'}
              </Button>

              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await authService.registerUserWithVerification({
                      ...form,
                      genero: form.genero.trim().toLowerCase(),
                      emailContacto: form.emailContacto
                    }, form.password);
                    setError('Correo reenviado. Por favor revisa tu bandeja de entrada o spam.');
                  } catch (e) {
                    if (e.code === 'auth/email-already-in-use') {
                      // Si ya existe en auth, solo reenviamos el correo sin intentar crear en firestore de nuevo
                      try {
                        const { getAuth, sendEmailVerification } = await import('firebase/auth');
                        const auth = getAuth();
                        if (auth.currentUser) {
                          await sendEmailVerification(auth.currentUser);
                          setError('Correo reenviado exitosamente.');
                        }
                      } catch {
                        setError('No se pudo reenviar el correo. Inicia sesion nuevamente e intentalo otra vez.');
                      }
                    } else {
                      setError('No se pudo reenviar el correo. ' + getRegisterErrorMessage(e));
                    }
                  }
                }}
                style={{ width: '100%' }}
              >
                Reenviar correo
              </Button>
            </motion.div>
          )}
        </motion.section>
      </section>
    </main>
  );
}

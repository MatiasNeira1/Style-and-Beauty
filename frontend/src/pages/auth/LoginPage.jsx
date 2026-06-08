import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CheckCircle2, Eye, EyeOff, Heart, Lock, Mail, Sparkles } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const firebaseErrorMessages = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta nuevamente en unos minutos.',
};

const loginBenefits = [
  'Revisa tus próximas reservas',
  'Gestiona tus tratamientos favoritos',
  'Accede a beneficios exclusivos',
];

const loginStats = [
  { value: '+10.000', label: 'clientas felices' },
  { value: '5 min', label: 'reserva rápida' },
  { value: 'VIP', label: 'beneficios beauty' },
];

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

const getLoginErrorMessage = (loginError) => {
  if (firebaseErrorMessages[loginError.code]) {
    return firebaseErrorMessages[loginError.code];
  }

  const message = loginError.message || '';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('network') || normalizedMessage.includes('conectar')) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté iniciado.';
  }

  return message || 'No se pudo iniciar sesión.';
};

function LoginField({ icon: Icon, label, id, trailing, ...props }) {
  return (
    <motion.label className="register-field" htmlFor={id} variants={itemVariants}>
      <span>{label}</span>
      <div className="register-input-shell">
        <Icon aria-hidden="true" size={18} />
        <input id={id} {...props} />
        {trailing}
      </div>
    </motion.label>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/perfil';
  const redirectState = location.state?.from?.state;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const session = await login(form.email, form.password);
      const requestedAdminRoute = redirectTo.startsWith('/admin');
      const destination = session.user?.rol === 'ADMIN'
        ? (requestedAdminRoute ? redirectTo : '/admin')
        : (requestedAdminRoute ? '/perfil' : redirectTo);
      navigate(destination, { replace: true });
      const destination = session.user?.rol === 'ADMIN' ? '/admin' : redirectTo;
      navigate(destination, { replace: true, state: redirectState });
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-experience login-experience">
      <div className="register-ambient register-ambient-one" />
      <div className="register-ambient register-ambient-two" />

      <section className="register-shell login-shell" aria-labelledby="login-title">
        <motion.aside
          className="register-hero-panel login-hero-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="register-hero-media login-hero-media" />
          <div className="register-hero-overlay" />
          <motion.div
            className="register-floating register-floating-top"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={18} />
            Bienestar reservado para ti
          </motion.div>
          <motion.div
            className="register-floating register-floating-bottom"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart size={18} />
            Tu rutina beauty continúa aquí
          </motion.div>

          <div className="register-hero-content">
            <span className="register-eyebrow">Acceso privado</span>
            <h2>Vuelve a tu espacio de cuidado personal.</h2>
            <p>
              Ingresa para reservar, revisar tus próximas sesiones y mantener tu experiencia Style & Beauty siempre a mano.
            </p>

            <div className="register-benefits">
              {loginBenefits.map((benefit) => (
                <span key={benefit}>
                  <CheckCircle2 size={16} />
                  {benefit}
                </span>
              ))}
            </div>

            <div className="register-stats">
              {loginStats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <motion.section
          className="register-form-panel login-form-panel"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-labelledby="login-title"
        >
          <motion.div className="register-heading" variants={itemVariants}>
            <span className="register-eyebrow">Bienvenida nuevamente</span>
            <h1 id="login-title">
              Accede a tu espacio <span>Style & Beauty</span>
            </h1>
            <div className="register-shine" aria-hidden="true" />
            <p>
              Continúa tu experiencia de bienestar, administra tus reservas y descubre beneficios pensados para ti.
            </p>
          </motion.div>

          <motion.form className="register-form-card login-form-card" onSubmit={handleSubmit} variants={itemVariants}>
            <motion.div className="login-form-fields" variants={containerVariants}>
              <LoginField
                icon={Mail}
                label="Email"
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tuemail@correo.com"
                autoComplete="email"
                required
              />
              <LoginField
                icon={Lock}
                label="Contraseña"
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                autoComplete="current-password"
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
            </motion.div>

            <div className="login-card-note">
              <CalendarCheck size={18} />
              <span>Tu próxima reserva, promociones y datos beauty estarán disponibles al ingresar.</span>
            </div>

            {error && (
              <motion.p className="admin-alert register-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {error}
              </motion.p>
            )}

            <Button className="register-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Entrar a mi espacio beauty'}
            </Button>

            <p className="register-login-note">
              ¿Aún no tienes cuenta? <NavLink className="text-link" to="/registro">Crear cuenta de cliente</NavLink>
            </p>
          </motion.form>
        </motion.section>
      </section>
    </main>
  );
}

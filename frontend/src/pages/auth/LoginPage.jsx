import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const firebaseErrorMessages = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta nuevamente en unos minutos.',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/perfil';

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
      const destination = session.user?.rol === 'ADMIN' ? '/admin' : redirectTo;
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(firebaseErrorMessages[loginError.code] || loginError.message || 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero page-hero-login">
        <div className="page-hero-media" />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="card-kicker">Acceso privado</span>
          <h1>Tu experiencia personalizada empieza aquí</h1>
          <p>Ingresa para reservar, revisar tu perfil y acceder a tus servicios con seguimiento personalizado.</p>
        </div>
      </section>

      <section className="page-section auth-section">
        <div>
          <SectionTitle eyebrow="Acceso" title="Iniciar sesión">
            Entra con tu cuenta para sincronizar tu perfil y acceder al panel correspondiente.
          </SectionTitle>
        </div>

        <Card className="auth-card" as="form" onSubmit={handleSubmit}>
          <Input label="Email" id="login-email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Contraseña" id="login-password" name="password" type="password" value={form.password} onChange={handleChange} required />
          {error && <p className="admin-alert">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
          <NavLink className="text-link" to="/registro">Crear cuenta de cliente</NavLink>
        </Card>
      </section>
    </>
  );
}

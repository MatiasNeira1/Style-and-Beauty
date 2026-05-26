import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

const firebaseErrorMessages = {
  'auth/invalid-credential': 'Correo o contrasena incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contrasena incorrecta.',
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
      let destination = redirectTo;
      if (session.user?.rol === 'ADMIN') {
        destination = '/admin';
      } else if (session.user?.rol === 'STAFF') {
        destination = '/staff';
      }
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(firebaseErrorMessages[loginError.code] || loginError.message || 'No se pudo iniciar sesion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section auth-section">
      <div>
        <SectionTitle eyebrow="Acceso" title="Iniciar sesion">
          Entra con tu cuenta para sincronizar tu perfil y acceder al panel correspondiente.
        </SectionTitle>
      </div>

      <Card className="auth-card" as="form" onSubmit={handleSubmit}>
        <Input label="Email" id="login-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Input label="Contrasena" id="login-password" name="password" type="password" value={form.password} onChange={handleChange} required />
        {error && <p className="admin-alert">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </Button>
        <NavLink className="text-link" to="/registro">Crear cuenta de cliente</NavLink>
      </Card>
    </section>
  );
}

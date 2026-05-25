import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
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

const firebaseErrorMessages = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { registerClient } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { password, ...profile } = form;
      await registerClient({
        email: form.emailContacto,
        password,
        profile,
      });
      navigate('/perfil', { replace: true });
    } catch (registerError) {
      setError(firebaseErrorMessages[registerError.code] || registerError.message || 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section auth-section">
      <div>
        <SectionTitle eyebrow="Cliente" title="Crear cuenta">
          Registra tu acceso y tus datos personales para reservar y gestionar tu perfil.
        </SectionTitle>
      </div>

      <Card className="auth-card" as="form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Input label="RUT" id="register-rut" name="rut" value={form.rut} onChange={handleChange} required />
          <Input label="Nombre" id="register-nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
          <Input label="Apellidos" id="register-apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
          <Input label="Email" id="register-email" name="emailContacto" type="email" value={form.emailContacto} onChange={handleChange} required />
          <Input label="Contraseña" id="register-password" name="password" type="password" minLength="6" value={form.password} onChange={handleChange} required />
          <Input label="Teléfono" id="register-telefono" name="telefono" value={form.telefono} onChange={handleChange} />
          <Input label="Fecha nacimiento" id="register-fecha" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
          <Input label="Género" id="register-genero" name="genero" value={form.genero} onChange={handleChange} />
        </div>
        {error && <p className="admin-alert">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <NavLink className="text-link" to="/login">Ya tengo cuenta</NavLink>
      </Card>
    </section>
  );
}

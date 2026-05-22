import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      // Route based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'employee') navigate('/employee');
      else navigate(from, { replace: true });
    } catch (err) {
      setError('Credenciales inválidas. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 'var(--page-x)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card style={{ maxWidth: '420px', width: '100%', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="brand" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Style &amp; Beauty</h1>
            <p style={{ color: 'var(--color-muted)' }}>Inicia sesión para continuar</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.8rem', borderRadius: 'var(--radius-xs)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.2rem' }}>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={16} /> Correo Electrónico</label>
              <Input 
                type="email" 
                required 
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <small>Tip: Usa 'admin@' o 'staff@' para otros roles.</small>
            </div>
            
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Lock size={16} /> Contraseña</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
            ¿No tienes cuenta? <a href="#" className="text-link">Regístrate aquí</a>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

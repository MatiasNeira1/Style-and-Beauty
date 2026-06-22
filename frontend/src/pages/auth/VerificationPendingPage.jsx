import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MailCheck, RefreshCw, LogOut, Mail, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { firebaseAuth } from '../../services/firebaseClient.js';
import { sendEmailVerification } from 'firebase/auth';
import { firebaseAuthService } from '../../services/firebaseAuthService.js';
import { motion } from 'framer-motion';

/**
 * VerificationPendingPage
 *
 * This page handles TWO scenarios:
 * 1. Post-registration: User just registered → signed out automatically → arrives here
 *    with pending email in sessionStorage. No Firebase session exists.
 * 2. Logged-in but unverified: User logged in but emailVerified === false →
 *    redirected here by RequireAuth.
 *
 * In scenario 1, the user must provide their password to temporarily sign in,
 * check verification status, and proceed. Or they can go to Login directly.
 */
export function VerificationPendingPage() {
  const { user, setSession, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Try to get the pending email from sessionStorage (post-registration scenario)
  const [pendingEmail] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem('style_beauty_pending_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.emailContacto || '';
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Determine the email to display
  const displayEmail = user?.email || pendingEmail || '';

  // If the user is authenticated AND verified, redirect to profile
  useEffect(() => {
    if (isAuthenticated && user?.emailVerified) {
      const from = location.state?.from?.pathname || '/perfil';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleVerifyEmail = useCallback(async () => {
    setIsVerifying(true);
    setError('');
    setSuccess('');

    try {
      const currentUser = firebaseAuth.currentUser;

      if (currentUser) {
        // User is signed in – reload and check verification
        await currentUser.reload();
        if (currentUser.emailVerified) {
          const session = await firebaseAuthService.refreshSession(currentUser);
          setSession(session);
          setSuccess('¡Correo verificado con éxito! Redirigiendo...');
          setTimeout(() => {
            const from = location.state?.from?.pathname || '/perfil';
            navigate(from, { replace: true });
          }, 1500);
        } else {
          setError('Aún no hemos detectado la verificación. Revisa tu bandeja de entrada o carpeta de spam.');
        }
      } else {
        // No active session – redirect to login
        setError('Inicia sesión para verificar el estado de tu correo.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al verificar. Intenta nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  }, [location, navigate, setSession]);

  const handleResendEmail = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);
    try {
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setSuccess('Correo de verificación reenviado con éxito.');
      } else {
        setError('Debes iniciar sesión para reenviar el correo de verificación.');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos antes de reenviar.');
      } else {
        setError('Error al reenviar el correo. Intenta de nuevo más tarde.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <main className="register-experience login-experience">
      <div className="register-ambient register-ambient-one" />
      <div className="register-ambient register-ambient-two" />

      <section className="register-shell login-shell" style={{ justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="register-form-card"
          style={{ textAlign: 'center', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px', width: '100%', margin: '0 auto' }}
        >
          <MailCheck size={64} color="var(--color-primary-strong)" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-ink)', fontWeight: 700 }}>
            Verificación Pendiente
          </h1>
          <p style={{ color: 'var(--color-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Hemos enviado un enlace de confirmación a tu correo electrónico:
            <br />
            {displayEmail && (
              <strong style={{ color: 'var(--color-ink)' }}>{displayEmail}</strong>
            )}
            <br /><br />
            Por favor, revisa tu bandeja de entrada o carpeta de spam y haz clic en el enlace para activar tu cuenta.
          </p>

          {error && (
            <p className="admin-alert register-error" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left' }}>
              {error}
            </p>
          )}

          {success && (
            <p className="success-alert" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'center', background: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              {success}
            </p>
          )}

          {isAuthenticated ? (
            <>
              {/* User IS logged in but unverified */}
              <Button
                onClick={handleVerifyEmail}
                disabled={isVerifying}
                style={{ width: '100%', marginBottom: '1rem', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} className={isVerifying ? 'spin' : ''} />
                {isVerifying ? 'Verificando...' : 'Ya verifiqué mi correo'}
              </Button>

              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <Button
                  variant="ghost"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Mail size={16} />
                  {isResending ? 'Enviando...' : 'Reenviar correo'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* User is NOT logged in (post-registration sign-out scenario) */}
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                Una vez que hayas verificado tu correo, inicia sesión para completar tu perfil.
              </p>
              <Button
                onClick={handleGoToLogin}
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <LogIn size={16} />
                Ir a Iniciar Sesión
              </Button>
            </>
          )}
        </motion.div>
      </section>
    </main>
  );
}

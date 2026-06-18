import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '../ui/Loader.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import { profileService } from '../../services/profileService.js';
import { isProfileNotFoundError } from '../../services/apiClient.js';

function AccessDenied() {
  return (
    <section className="page-section">
      <div className="auth-guard-card" role="alert">
        <strong>Acceso denegado</strong>
        <p>No tienes permisos para ingresar a esta sección.</p>
      </div>
    </section>
  );
}

export function RequireAuth({ children, roles }) {
  const location = useLocation();
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const sessionQuery = useQuery({
    queryKey: ['auth-session', user?.uid],
    queryFn: profileService.getMyProfile,
    enabled: isAuthReady && isAuthenticated,
    retry: false,
    staleTime: 1000 * 60,
  });

  if (!isAuthReady) {
    return (
      <section className="page-section">
        <Loader />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (sessionQuery.error?.status === 401) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (sessionQuery.error?.status === 403) {
    return <AccessDenied />;
  }

  if (sessionQuery.error?.status && !isProfileNotFoundError(sessionQuery.error)) {
    return (
      <section className="page-section">
        <div className="auth-guard-card" role="alert">
          <strong>No pudimos validar tu perfil</strong>
          <p>{sessionQuery.error.message || 'Intenta nuevamente en unos minutos.'}</p>
        </div>
      </section>
    );
  }

  if (roles?.length && !roles.includes(user?.rol)) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}

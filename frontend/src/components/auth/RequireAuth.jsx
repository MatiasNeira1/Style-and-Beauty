import { Navigate, useLocation } from 'react-router-dom';
import { Loader } from '../ui/Loader.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

export function RequireAuth({ children, roles }) {
  const location = useLocation();
  const { user, isAuthenticated, isAuthReady } = useAuth();

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

  if (roles?.length && !roles.includes(user?.rol)) {
    const isLocalDev = window.location.hostname === 'localhost';
    const isStaffOrAdminRoute = roles.includes('STAFF') || roles.includes('ADMIN');

    if (isLocalDev && isStaffOrAdminRoute) {
      console.warn("Desarrollo Local: Acceso temporal permitido para pruebas del Portal sin rol en Firebase:", user?.email);
    } else {
      return <Navigate to="/perfil" replace />;
    }
  }

  return children;
}

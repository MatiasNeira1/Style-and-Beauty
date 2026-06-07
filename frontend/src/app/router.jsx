import { lazy, Suspense } from 'react';
import { createBrowserRouter, useLocation } from 'react-router-dom';
import { RequireAuth } from '../components/auth/RequireAuth.jsx';
import { AdminLayout } from '../components/layout/AdminLayout.jsx';
import { RootLayout } from '../components/layout/RootLayout.jsx';
import { Loader } from '../components/ui/Loader.jsx';
import { LazyRouteErrorBoundary, RouteErrorBoundary } from '../components/ui/RouteErrorBoundary.jsx';

function LazyRouteShell({ children }) {
  const location = useLocation();

  return (
    <LazyRouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<Loader />}>
        {children}
      </Suspense>
    </LazyRouteErrorBoundary>
  );
}

function lazyRoute(load, exportName) {
  const Component = lazy(() => load().then((module) => ({ default: module[exportName] })));
  return (
    <LazyRouteShell>
      <Component />
    </LazyRouteShell>
  );
}

function protectedRoute(element, roles) {
  return <RequireAuth roles={roles}>{element}</RequireAuth>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: lazyRoute(() => import('../pages/public/HomePage.jsx'), 'HomePage') },
      { path: 'servicios', element: lazyRoute(() => import('../pages/public/ServicesPage.jsx'), 'ServicesPage') },
      { path: 'servicios/:categoria/:servicio', element: lazyRoute(() => import('../pages/public/ServiceDetailPage.jsx'), 'ServiceDetailPage') },
      { path: 'servicios/:categoria', element: lazyRoute(() => import('../pages/public/ServiceCategoryPage.jsx'), 'ServiceCategoryPage') },
      { path: 'profesionales', element: lazyRoute(() => import('../pages/public/ProfessionalsPage.jsx'), 'ProfessionalsPage') },
      { path: 'productos', element: lazyRoute(() => import('../pages/public/ProductsPage.jsx'), 'ProductsPage') },
      { path: 'nosotros', element: lazyRoute(() => import('../pages/public/AboutPage.jsx'), 'AboutPage') },
      { path: 'contacto', element: lazyRoute(() => import('../pages/public/ContactPage.jsx'), 'ContactPage') },
      { path: 'reservar', element: protectedRoute(lazyRoute(() => import('../pages/client/BookingPage.jsx'), 'BookingPage')) },
      { path: 'checkout', element: protectedRoute(lazyRoute(() => import('../pages/client/CheckoutPage.jsx'), 'CheckoutPage')) },
      { path: 'login', element: lazyRoute(() => import('../pages/auth/LoginPage.jsx'), 'LoginPage') },
      { path: 'registro', element: lazyRoute(() => import('../pages/auth/RegisterPage.jsx'), 'RegisterPage') },
      { path: 'perfil', element: protectedRoute(lazyRoute(() => import('../pages/client/ProfilePage.jsx'), 'ProfilePage')) },
      { path: 'reserva-extraordinaria', element: protectedRoute(lazyRoute(() => import('../pages/client/ExtraordinaryBookingPage.jsx'), 'ExtraordinaryBookingPage')) },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth roles={['ADMIN']}>
        <AdminLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: lazyRoute(() => import('../pages/admin/AdminDashboard.jsx'), 'AdminDashboard') },
      { path: 'dashboard', element: lazyRoute(() => import('../pages/admin/AdminDashboard.jsx'), 'AdminDashboard') },
      { path: 'agenda', element: lazyRoute(() => import('../pages/admin/AgendaAdminPage.jsx'), 'AgendaAdminPage') },
      { path: 'servicios', element: lazyRoute(() => import('../pages/admin/ServicesAdminPage.jsx'), 'ServicesAdminPage') },
      { path: 'inventario', element: lazyRoute(() => import('../pages/admin/InventoryAdminPage.jsx'), 'InventoryAdminPage') },
      { path: 'pagos', element: lazyRoute(() => import('../pages/admin/PaymentsAdminPage.jsx'), 'PaymentsAdminPage') },
      { path: 'clientes', element: lazyRoute(() => import('../pages/admin/ClientsAdminPage.jsx'), 'ClientsAdminPage') },
      { path: 'staff', element: lazyRoute(() => import('../pages/admin/StaffAdminPage.jsx'), 'StaffAdminPage') },
      { path: 'perfil', element: lazyRoute(() => import('../pages/admin/AdminProfilePage.jsx'), 'AdminProfilePage') },
    ],
  },
  {
    path: '/employee',
    element: <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Portal de Empleado</h2><p>Módulo administrado externamente.</p></div>,
  },
]);

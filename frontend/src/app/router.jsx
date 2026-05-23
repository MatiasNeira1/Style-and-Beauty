import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout.jsx';
import { AdminLayout } from '../components/layout/AdminLayout.jsx';
import { RequireAuth } from '../components/auth/RequireAuth.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { HomePage } from '../pages/public/HomePage.jsx';
import { ServicesPage } from '../pages/public/ServicesPage.jsx';
import { ProductsPage } from '../pages/public/ProductsPage.jsx';
import { AboutPage } from '../pages/public/AboutPage.jsx';
import { ContactPage } from '../pages/public/ContactPage.jsx';
import { BookingPage } from '../pages/client/BookingPage.jsx';
import { CheckoutPage } from '../pages/client/CheckoutPage.jsx';
import { ProfilePage } from '../pages/client/ProfilePage.jsx';
import { ExtraordinaryBookingPage } from '../pages/client/ExtraordinaryBookingPage.jsx';
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx';
import { AgendaAdminPage } from '../pages/admin/AgendaAdminPage.jsx';
import { ServicesAdminPage } from '../pages/admin/ServicesAdminPage.jsx';
import { InventoryAdminPage } from '../pages/admin/InventoryAdminPage.jsx';
import { PaymentsAdminPage } from '../pages/admin/PaymentsAdminPage.jsx';
import { ClientsAdminPage } from '../pages/admin/ClientsAdminPage.jsx';
import { StaffAdminPage } from '../pages/admin/StaffAdminPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'servicios', element: <ServicesPage /> },
      { path: 'productos', element: <ProductsPage /> },
      { path: 'nosotros', element: <AboutPage /> },
      { path: 'contacto', element: <ContactPage /> },
      { path: 'reservar', element: <BookingPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      { path: 'perfil', element: <ProfilePage /> },
      { path: 'reserva-extraordinaria', element: <ExtraordinaryBookingPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth roles={['ADMIN']}>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'agenda', element: <AgendaAdminPage /> },
      { path: 'servicios', element: <ServicesAdminPage /> },
      { path: 'inventario', element: <InventoryAdminPage /> },
      { path: 'pagos', element: <PaymentsAdminPage /> },
      { path: 'clientes', element: <ClientsAdminPage /> },
      { path: 'staff', element: <StaffAdminPage /> }
    ],
  },
  {
    path: '/employee',
    element: <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Portal de Empleado</h2><p>Módulo administrado externamente.</p></div>
  }
]);

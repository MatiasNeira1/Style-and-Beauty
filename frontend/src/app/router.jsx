import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout.jsx';
import { HomePage } from '../pages/public/HomePage.jsx';
import { ServicesPage } from '../pages/public/ServicesPage.jsx';
import { ProductsPage } from '../pages/public/ProductsPage.jsx';
import { AboutPage } from '../pages/public/AboutPage.jsx';
import { ContactPage } from '../pages/public/ContactPage.jsx';
import { BookingPage } from '../pages/client/BookingPage.jsx';
import { CheckoutPage } from '../pages/client/CheckoutPage.jsx';
import { ProfilePage } from '../pages/client/ProfilePage.jsx';
import { ExtraordinaryBookingPage } from '../pages/client/ExtraordinaryBookingPage.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';

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
      { path: 'perfil', element: <ProfilePage /> },
      { path: 'reserva-extraordinaria', element: <ExtraordinaryBookingPage /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/admin',
    element: <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Portal de Administrador</h2><p>Módulo administrado externamente.</p></div>
  },
  {
    path: '/employee',
    element: <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Portal de Empleado</h2><p>Módulo administrado externamente.</p></div>
  }
]);

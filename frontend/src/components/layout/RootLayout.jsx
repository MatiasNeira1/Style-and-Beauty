import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import { Navbar } from './Navbar.jsx';
import { PageTransition } from './PageTransition.jsx';
import { CartDrawer } from '../shop/CartDrawer.jsx';

export function RootLayout() {
  const location = useLocation();

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <PageTransition routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}

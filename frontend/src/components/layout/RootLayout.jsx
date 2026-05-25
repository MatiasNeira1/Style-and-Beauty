import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import { Navbar } from './Navbar.jsx';
import { PageTransition } from './PageTransition.jsx';
import { CartDrawer } from '../shop/CartDrawer.jsx';
import { VirtualTour } from '../animations/VirtualTour.jsx';
import { ClientChatbot } from '../chat/ClientChatbot.jsx';

export function RootLayout() {
  const location = useLocation();
  const showScrollBackground = location.pathname === '/';

  return (
    <div className="app-shell">
      {showScrollBackground && <VirtualTour />}
      <Navbar />
      <PageTransition routeKey={location.pathname}>
        <Outlet />
      </PageTransition>
      <Footer />
      <CartDrawer />
      <ClientChatbot />
    </div>
  );
}

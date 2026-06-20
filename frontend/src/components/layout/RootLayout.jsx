import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import { Navbar } from './Navbar.jsx';
import { PageTransition } from './PageTransition.jsx';
import { ScrollToTop } from './ScrollToTop.jsx';
import { CartDrawer } from '../shop/CartDrawer.jsx';
import { ClientChatbot } from '../chat/ClientChatbot.jsx';

export function RootLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <ScrollToTop />
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

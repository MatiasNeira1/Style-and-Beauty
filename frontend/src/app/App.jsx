import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { PageTransition } from '../components/layout/PageTransition.jsx';

export function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <PageTransition>
        <main>
          <Outlet />
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}

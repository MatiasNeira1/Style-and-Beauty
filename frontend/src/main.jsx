import ReactDOM from 'react-dom/client';
import Lenis from 'lenis';
import { App } from './app/App.jsx';
import './styles/tokens.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/admin.css';
import './styles/client.css';

/* ── Lenis Smooth Scroll ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

/* ── Mount App ── */
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
);

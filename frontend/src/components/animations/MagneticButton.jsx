import { useCallback, useRef } from 'react';
import gsap from 'gsap';
import { Button } from '../ui/Button.jsx';

export function MagneticButton({ children, ...props }) {
  const ref = useRef(null);

  const handleMove = useCallback((event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * 0.22, y: y * 0.32, duration: 0.35, ease: 'power3.out' });
  }, []);

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  }, []);

  const handleClick = useCallback((event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    ref.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  }, []);

  return (
    <Button
      ref={ref}
      className="magnetic-button"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

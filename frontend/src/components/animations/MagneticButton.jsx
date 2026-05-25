import { useRef } from 'react';
import { useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Button } from '../ui/Button.jsx';

export function MagneticButton({ children, ...props }) {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.12}px, ${y * 0.16}px)`;
  };

  const handleLeave = () => {
    ref.current.style.transform = 'translate(0, 0)';
  };
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * 0.22, y: y * 0.32, duration: 0.35, ease: 'power3.out' });
  }, []);

  const handleLeave = useCallback(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  }, []);

  const handleClick = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
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

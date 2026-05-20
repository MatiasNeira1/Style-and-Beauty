import { useRef } from 'react';
import gsap from 'gsap';
import { Button } from '../ui/Button.jsx';

export function MagneticButton(props) {
  const ref = useRef(null);

  const handleMove = (event) => {
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * 0.22, y: y * 0.32, duration: 0.35, ease: 'power3.out' });
  };

  const handleLeave = () => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1, 0.35)' });
  };

  return <Button ref={ref} className="magnetic-button" onMouseMove={handleMove} onMouseLeave={handleLeave} {...props} />;
}

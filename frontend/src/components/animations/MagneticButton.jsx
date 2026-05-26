import { useRef } from 'react';
import { Button } from '../ui/Button.jsx';

export function MagneticButton(props) {
  const ref = useRef(null);

  const handleMove = (event) => {
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.12}px, ${y * 0.16}px)`;
  };

  const handleLeave = () => {
    ref.current.style.transform = 'translate(0, 0)';
  };

  return <Button ref={ref} className="magnetic-button" onMouseMove={handleMove} onMouseLeave={handleLeave} {...props} />;
}

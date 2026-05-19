import { useGsapReveal } from '../../hooks/useGsapReveal.js';

export function Reveal({ children, className = '' }) {
  const ref = useGsapReveal();
  return <div ref={ref} className={className}>{children}</div>;
}

import { useGsapReveal } from '../../hooks/useGsapReveal.js';

export function Reveal({ children, className = '', stagger = false }) {
  const ref = useGsapReveal({ stagger });
  return <div ref={ref} className={className}>{children}</div>;
}

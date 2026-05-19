export function AnimatedCounter({ value, suffix = '' }) {
  return <strong className="animated-counter">{value}{suffix}</strong>;
}

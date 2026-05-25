import { CountUp } from './CountUp.jsx';

export function AnimatedCounter({ value, suffix = '' }) {
  return <CountUp value={value} suffix={suffix} />;
}

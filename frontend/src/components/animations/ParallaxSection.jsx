export function ParallaxSection({ children, className = '' }) {
  return <section className={`parallax-section ${className}`.trim()}>{children}</section>;
}

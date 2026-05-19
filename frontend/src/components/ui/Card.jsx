export function Card({ children, className = '', as: Component = 'article' }) {
  return <Component className={`card ${className}`.trim()}>{children}</Component>;
}

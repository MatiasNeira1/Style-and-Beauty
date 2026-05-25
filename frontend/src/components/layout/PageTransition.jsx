export function PageTransition({ children, routeKey }) {
  return <main key={routeKey} className="page-transition">{children}</main>;
}

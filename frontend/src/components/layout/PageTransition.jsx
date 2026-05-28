import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function PageTransition({ children, routeKey }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y: 18, filter: 'blur(4px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' },
      );
    }, ref);

    return () => ctx.revert();
  }, [routeKey]);

  return (
    <main ref={ref} key={routeKey} className="page-transition">
      {children}
    </main>
  );
}

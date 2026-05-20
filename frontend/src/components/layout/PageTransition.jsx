import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function PageTransition({ children, routeKey }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out' });
    }, ref);

    return () => ctx.revert();
  }, [routeKey]);

  return <main ref={ref} className="page-transition">{children}</main>;
}

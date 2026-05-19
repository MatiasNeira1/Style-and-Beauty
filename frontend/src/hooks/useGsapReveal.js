import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapReveal({ stagger = false } = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      const target = stagger ? ref.current.children : ref.current;
      gsap.fromTo(target, { autoAlpha: 0, y: 34 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.75,
        ease: 'power3.out',
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 82%',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [stagger]);

  return ref;
}

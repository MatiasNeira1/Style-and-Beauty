import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useGsapReveal() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6 });
  }, []);

  return ref;
}

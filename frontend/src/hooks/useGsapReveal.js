import { useEffect, useRef } from 'react';

export function useGsapReveal({ stagger = false } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const target = ref.current;
    const animatedNodes = stagger ? Array.from(target.children) : [target];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        animatedNodes.forEach((node, index) => {
          node.style.transition = 'opacity 420ms ease, transform 420ms ease';
          node.style.transitionDelay = stagger ? `${index * 60}ms` : '0ms';
          node.style.opacity = '1';
          node.style.transform = 'translateY(0)';
        });
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    animatedNodes.forEach((node) => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(18px)';
      node.style.willChange = 'opacity, transform';
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, [stagger]);

  return ref;
}

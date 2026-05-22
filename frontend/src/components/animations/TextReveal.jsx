import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function TextReveal({ children, className = '', as: Tag = 'h1' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const text = typeof children === 'string' ? children : '';
  const words = text ? text.split(' ') : [];

  if (!text) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.3em', verticalAlign: 'top' }}>
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '110%' }}
            animate={isInView ? { y: '0%' } : { y: '110%' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.055 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

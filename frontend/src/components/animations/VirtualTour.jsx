import { motion, useScroll, useTransform } from 'framer-motion';

const tourImages = [
  '/hero-salon.png',
  '/jefes.png',
  '/logo.jpg',
];

export function VirtualTour() {
  const { scrollYProgress } = useScroll();

  // Opacity transitions between images based on scroll
  const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.4], [1, 1, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.6, 0.7, 1], [0, 1, 1]);

  // Subtle zoom effect to simulate walking through the clinic
  const scale1 = useTransform(scrollYProgress, [0, 0.4], [1, 1.1]);
  const scale2 = useTransform(scrollYProgress, [0.3, 0.7], [1, 1.1]);
  const scale3 = useTransform(scrollYProgress, [0.6, 1], [1, 1.1]);

  const images = [
    { src: tourImages[0], opacity: opacity1, scale: scale1 },
    { src: tourImages[1], opacity: opacity2, scale: scale2 },
    { src: tourImages[2], opacity: opacity3, scale: scale3 }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none', overflow: 'hidden', background: '#fdfafb' }}>
      {images.map((img, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: -50, // Bleed to prevent edges showing during scale
            backgroundImage: `url(${img.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: img.opacity,
            scale: img.scale,
            filter: 'blur(4px)', // Reduced blur as requested
          }}
        />
      ))}
      
      {/* Light Overlay to ensure text readability against the tour images and maintain the pastel executive vibe */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(253, 250, 251, 0.7) 0%, rgba(253, 250, 251, 0.9) 100%)',
        }}
      />
    </div>
  );
}

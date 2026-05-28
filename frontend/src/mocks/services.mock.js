export const serviceCategories = [
  {
    id: 'nails',
    nombre: 'Nails',
    descripcion: 'Manicure, pedicure y diseños con terminación premium.',
    heroTitle: 'Servicios de Nails',
    heroSubtitle: 'Manicure, pedicure, softgel, acrílicas y diseños personalizados.',
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'cabello',
    nombre: 'Cabello',
    descripcion: 'Corte, color, hidratación y styling profesional.',
    heroTitle: 'Servicios de Cabello',
    heroSubtitle: 'Corte, coloración, styling y tratamientos capilares.',
    imagen: '/hero-salon.png',
  },
  {
    id: 'piel',
    nombre: 'Cuidados de la Piel',
    descripcion: 'Faciales, peeling y tratamientos para una piel luminosa.',
    heroTitle: 'Cuidados de la Piel',
    heroSubtitle: 'Faciales, aparatología y tratamientos para una piel luminosa.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'spa',
    nombre: 'Masajes o SPA',
    descripcion: 'Rituales de relajación, drenaje y bienestar corporal.',
    heroTitle: 'Masajes y SPA',
    heroSubtitle: 'Rituales de relajación, drenaje y bienestar corporal.',
    imagen: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'maquillajes',
    nombre: 'Maquillajes',
    descripcion: 'Looks sociales, novias y preparación profesional de piel.',
    heroTitle: 'Maquillajes profesionales',
    heroSubtitle: 'Looks sociales, de novia, noche y preparación de piel.',
    imagen: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  },
];

const serviceItems = {
  nails: [
    ['Uñas acrílicas', 'Esculpido resistente con acabado elegante y personalizado.', 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80'],
    ['Uñas softgel', 'Extensiones livianas, cómodas y de aspecto natural.', 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80'],
    ['Uñas permanentes', 'Esmaltado duradero con brillo premium.', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80'],
    ['Manicure tradicional', 'Cuidado clásico de manos, cutículas y esmaltado.', 'https://images.unsplash.com/photo-1610992235683-e39b53f2201a?auto=format&fit=crop&w=900&q=80'],
    ['Pedicure spa', 'Ritual de pies con exfoliación, hidratación y esmaltado.', 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=900&q=80'],
    ['Nail art', 'Diseños personalizados con detalles finos y creativos.', 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=80'],
  ],
  cabello: [
    ['Corte de pelo', 'Corte personalizado con asesoría de estilo.', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80'],
    ['Mechas', 'Iluminación capilar con técnica profesional.', 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80'],
    ['Tintura', 'Coloración completa con cuidado de fibra capilar.', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80'],
    ['Botox capilar', 'Tratamiento de brillo, suavidad y control de frizz.', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=900&q=80'],
    ['Alisado', 'Acabado liso, pulido y manejable.', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80'],
    ['Hidratación capilar', 'Nutrición profunda para cabello suave y luminoso.', 'https://images.unsplash.com/photo-1595475884562-073c30d45670?auto=format&fit=crop&w=900&q=80'],
    ['Peinados', 'Styling para eventos, sesiones y ocasiones especiales.', 'https://images.unsplash.com/photo-1523263685509-57c1d050d19b?auto=format&fit=crop&w=900&q=80'],
  ],
  piel: [
    ['Limpieza facial', 'Limpieza profunda para piel fresca y equilibrada.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80'],
    ['Peeling facial', 'Renovación suave para mejorar textura y luminosidad.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80'],
    ['Aparatología para eliminación de arrugas', 'Tecnología estética para suavizar líneas de expresión.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80'],
    ['Eliminación de cicatrices', 'Tratamiento facial enfocado en textura y uniformidad.', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80'],
    ['Rejuvenecimiento facial', 'Protocolo glow para piel descansada y luminosa.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80'],
    ['Tratamientos antiacné', 'Cuidado especializado para piel con tendencia acneica.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'],
    ['Hidratación profunda', 'Skincare intensivo para recuperar elasticidad y brillo.', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80'],
  ],
  spa: [
    ['Masaje descontracturante', 'Trabajo corporal profundo para aliviar tensión.', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80'],
    ['Masaje relajante', 'Sesión suave para calma, descanso y bienestar.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80'],
    ['Masaje linfático', 'Drenaje manual para sensación de ligereza corporal.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80'],
    ['Masaje reductivo', 'Masaje corporal focalizado y energizante.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'],
    ['Drenaje corporal', 'Tratamiento para bienestar, descanso y circulación.', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80'],
    ['Ritual spa', 'Experiencia integral de relajación y cuidado sensorial.', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80'],
  ],
  maquillajes: [
    ['Maquillaje de día', 'Look natural, luminoso y fresco.', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80'],
    ['Maquillaje de noche', 'Acabado sofisticado para eventos y celebraciones.', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80'],
    ['Maquillaje de novia', 'Look elegante, duradero y fotogénico.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'],
    ['Maquillaje social', 'Maquillaje versátil para eventos especiales.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'],
    ['Perfilado y preparación de piel', 'Preparación profesional para un acabado impecable.', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'],
  ],
};

export const mockServices = serviceCategories.flatMap((category, categoryIndex) => (
  serviceItems[category.id].map(([nombre, descripcion, imagen], index) => ({
    id: `${category.id}-${index + 1}`,
    nombre,
    categoriaId: category.id,
    categoria: category.nombre,
    descripcion,
    duracion: `${45 + ((index + categoryIndex) % 4) * 15} min`,
    precio: 18990 + ((index + categoryIndex) % 7) * 5000,
    imagen,
  }))
));

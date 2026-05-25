const specialtyColors = {
  Cosmetóloga: '#d86f9f',
  'Esteticista integral': '#e98975',
  'Kinesióloga estética': '#c89a45',
  Masoterapeuta: '#8aa56b',
  Manicurista: '#b579d6',
  'Especialista en depilación láser': '#df8d63',
  'Especialista facial': '#d4a15f',
  'Especialista corporal': '#db7f64',
  'Maquilladora profesional': '#c46aa1',
  'Estilista capilar': '#c8915d',
  Colorista: '#b87352',
  Lashista: '#9d7bd8',
  'Brow artist': '#a87b5f',
};

const professionalsSeed = [
  ['Isidora', 'Valdés', 'Cosmetóloga', 'Limpiezas profundas, glow facial y preparación de piel.'],
  ['Camila', 'Torres', 'Esteticista integral', 'Tratamientos faciales, corporales y rutinas de bienestar.'],
  ['Martina', 'Salas', 'Kinesióloga estética', 'Drenaje, modelación corporal y planes post tratamiento.'],
  ['Javiera', 'Muñoz', 'Masoterapeuta', 'Masajes relajantes, descontracturantes y rituales spa.'],
  ['Antonia', 'Herrera', 'Manicurista', 'Manicure premium, softgel, esmaltado permanente y nail art.'],
  ['Emilia', 'Castro', 'Especialista en depilación láser', 'Protocolos personalizados para depilación láser y cuidado de piel.'],
  ['Fernanda', 'López', 'Especialista facial', 'Hidratación, luminosidad y rejuvenecimiento facial.'],
  ['Catalina', 'Araya', 'Especialista corporal', 'Modelación, drenaje y tratamientos reductivos en cabina.'],
  ['Daniela', 'Soto', 'Maquilladora profesional', 'Maquillajes sociales, novias y preparación de piel.'],
  ['Renata', 'Silva', 'Estilista capilar', 'Cortes, peinados y styling con acabado de salón.'],
  ['Florencia', 'Rivas', 'Colorista', 'Coloración, mechas, gloss y diagnóstico de fibra capilar.'],
  ['Josefa', 'Morales', 'Lashista', 'Lifting, extensiones y diseño de mirada natural.'],
  ['Amanda', 'Vega', 'Brow artist', 'Perfilado, laminado y diseño de cejas personalizado.'],
  ['Maite', 'Fuentes', 'Cosmetóloga', 'Peeling, antiacné y planes de cuidado en casa.'],
  ['Constanza', 'Paredes', 'Manicurista', 'Uñas acrílicas, permanente y diseños editoriales.'],
  ['Valentina', 'Rojas', 'Especialista facial', 'Tratamientos antiage, hidratación profunda y glow.'],
  ['Sofia', 'Caceres', 'Esteticista integral', 'Experiencias de bienestar facial y corporal.'],
  ['Trinidad', 'Molina', 'Masoterapeuta', 'Relajación profunda, drenaje y masajes reductivos.'],
  ['Agustina', 'Bravo', 'Especialista corporal', 'Aparatología corporal y protocolos reafirmantes.'],
  ['Belén', 'Navarro', 'Estilista capilar', 'Cortes signature, peinados y asesoría de imagen.'],
  ['Paula', 'Campos', 'Colorista', 'Balayage, tintura y cuidado intensivo del color.'],
  ['Rocío', 'Méndez', 'Kinesióloga estética', 'Drenaje linfático, recuperación y modelación.'],
  ['Ignacia', 'Lara', 'Lashista', 'Volumen natural, lifting y cuidado de pestañas.'],
  ['Paz', 'Contreras', 'Brow artist', 'Arquitectura de cejas, tinte y laminado.'],
  ['Francisca', 'Leiva', 'Maquilladora profesional', 'Maquillaje de día, noche y eventos especiales.'],
];

const statuses = ['Disponible hoy', 'En cabina', 'Agenda llena', 'Ausente'];
const branches = ['Providencia', 'Las Condes', 'Vitacura', 'Online'];
const modalities = ['Presencial', 'Presencial / Online', 'Online'];
const hours = [
  ['09:30', '11:00', '15:30'],
  ['10:00', '12:30', '17:00'],
  ['08:45', '14:00', '18:15'],
    ['Mañana 09:00', 'Mañana 13:00'],
  ['11:30', '15:00', '18:00'],
  ['10:30', '12:30', '17:30'],
];

export const mockProfessionals = professionalsSeed.map(([nombre, apellidos, especialidad, descripcion], index) => {
  const proximasHoras = hours[index % hours.length];
  return {
    id: `beauty-pro-${index + 1}`,
    nombre,
    apellidos,
    fullName: `${nombre} ${apellidos}`,
    cargo: especialidad,
    especialidad,
    descripcion,
    sucursal: branches[index % branches.length],
    modalidad: modalities[index % modalities.length],
    estado: statuses[index % statuses.length],
    proximaHora: proximasHoras[0],
    proximasHoras,
    fotoUrl: '/logo.jpg',
    colorEspecialidad: specialtyColors[especialidad],
  };
});

export const specialtyColorMap = specialtyColors;

const specialtyThemes = [
  { key: 'cosmetologia', match: ['cosmetologa', 'cosmetologo', 'cosmetologia'], color: '#d86f9f', soft: 'rgba(216, 111, 159, 0.16)' },
  { key: 'estetica', match: ['esteticista integral', 'estetica integral'], color: '#e98975', soft: 'rgba(233, 137, 117, 0.16)' },
  { key: 'kinesiologia', match: ['kinesiologa estetica', 'kinesiologo estetico', 'kinesiologia estetica'], color: '#c89a45', soft: 'rgba(200, 154, 69, 0.16)' },
  { key: 'masoterapia', match: ['masoterapeuta', 'masoterapia', 'masaje'], color: '#8aa56b', soft: 'rgba(138, 165, 107, 0.16)' },
  { key: 'manicure', match: ['manicurista', 'manicure', 'nail'], color: '#b579d6', soft: 'rgba(181, 121, 214, 0.16)' },
  { key: 'laser', match: ['depilacion laser', 'laser'], color: '#df8d63', soft: 'rgba(223, 141, 99, 0.16)' },
  { key: 'facial', match: ['especialista facial', 'facial', 'piel'], color: '#d4a15f', soft: 'rgba(212, 161, 95, 0.16)' },
  { key: 'corporal', match: ['especialista corporal', 'corporal', 'modelacion'], color: '#db7f64', soft: 'rgba(219, 127, 100, 0.16)' },
  { key: 'nutricion', match: ['nutricionista estetica', 'nutricion', 'bienestar'], color: '#6fae91', soft: 'rgba(111, 174, 145, 0.16)' },
  { key: 'maquillaje', match: ['maquilladora profesional', 'maquillaje', 'makeup'], color: '#c46aa1', soft: 'rgba(196, 106, 161, 0.16)' },
  { key: 'capilar', match: ['estilista capilar', 'cabello', 'capilar', 'peinado'], color: '#c8915d', soft: 'rgba(200, 145, 93, 0.16)' },
  { key: 'color', match: ['colorista', 'coloracion', 'mechas', 'tintura'], color: '#b87352', soft: 'rgba(184, 115, 82, 0.16)' },
  { key: 'lash', match: ['lashista', 'pestanas', 'lifting'], color: '#9d7bd8', soft: 'rgba(157, 123, 216, 0.16)' },
  { key: 'brow', match: ['brow artist', 'cejas', 'brow'], color: '#a87b5f', soft: 'rgba(168, 123, 95, 0.16)' },
];

const defaultTheme = { key: 'default', color: '#d47a9e', soft: 'rgba(212, 122, 158, 0.16)' };

export function professionalTheme(specialty = '') {
  const normalized = specialty.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return specialtyThemes.find((theme) => theme.match.some((item) => normalized.includes(item))) || defaultTheme;
}

export function statusTone(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('disponible')) return 'available';
  if (normalized.includes('cabina') || normalized.includes('sesion') || normalized.includes('llena')) return 'busy';
  return 'away';
}

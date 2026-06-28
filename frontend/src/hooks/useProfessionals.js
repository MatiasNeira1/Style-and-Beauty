import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { STAFF_QUERY_OPTIONS, staffService } from '../services/staffService.js';

const emptyProfessional = {
  nombre: 'Profesional',
  apellidos: '',
  especialidad: 'Especialista',
  descripcion: 'Perfil profesional pendiente de completar.',
  sucursal: 'Providencia',
  modalidad: 'Presencial',
  estado: 'Consultar disponibilidad',
  proximasHoras: [],
  fotoUrl: null,
  colorEspecialidad: undefined,
};

function getProfessionalId(member) {
  return member.idStaff || member.idPersona || member.id || member.idAuth || `${member.nombre}-${member.apellidos || member.apellido || ''}`;
}

function normalizeValue(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const medicalTerms = ['doctor', 'doctora', 'medico', 'medica', 'clinico', 'clinica', 'cardio', 'derma', 'pedia', 'psico', 'trauma', 'consulta', 'paciente'];

function hasMedicalTerm(value = '') {
  const normalized = normalizeValue(value);
  return medicalTerms.some((term) => normalized.includes(term));
}

function fallback() {
  return emptyProfessional;
}

function specialtyName(member, index) {
  const value = member.especialidad?.nombre || member.especialidad || member.rol || member.cargo || fallback(index).especialidad;
  return hasMedicalTerm(value) ? fallback(index).especialidad : value;
}

function portfolioImages(member) {
  const images = member.portfolioImages || member.portfolio || member.trabajos || member.galeria || [];
  return Array.isArray(images)
    ? images.map((image) => (typeof image === 'string' ? image : image.urlFoto || image.url || image.imageUrl)).filter(Boolean)
    : [];
}

export function normalizeProfessional(member, index = 0) {
  const specialty = specialtyName(member, index);
  const rawCargo = member.cargo || member.rol || specialty;
  const fallbackProfessional = fallback(index);
  const proximasHoras = member.proximasHoras || member.horasDisponibles || fallbackProfessional.proximasHoras;

  return {
    id: getProfessionalId(member),
    idStaff: member.idStaff || member.idPersona || member.id,
    idPersona: member.idPersona || member.idStaff || member.id,
    nombre: member.nombre || member.name || fallbackProfessional.nombre,
    apellidos: member.apellidos || member.apellido || fallbackProfessional.apellidos,
    fullName: `${member.nombre || member.name || fallbackProfessional.nombre} ${member.apellidos || member.apellido || fallbackProfessional.apellidos}`.trim(),
    cargo: hasMedicalTerm(rawCargo) ? specialty : rawCargo,
    especialidad: specialty,
    descripcion: member.descripcionPerfil || member.descripcion || member.bio || member.resumen || fallbackProfessional.descripcion,
    trayectoria: member.descripcionPerfil || member.trayectoria || fallbackProfessional.trayectoria,
    biografiaProfesional: member.biografiaProfesional || member.descripcionPerfil || member.descripcion || member.bio || member.resumen,
    perfilCurricular: member.perfilCurricular || member.descripcionPerfil || member.trayectoria,
    sucursal: member.sucursal || member.sede || fallbackProfessional.sucursal,
    modalidad: member.modalidad || fallbackProfessional.modalidad,
    estado: hasMedicalTerm(member.estado) ? fallbackProfessional.estado : member.estado || fallbackProfessional.estado,
    proximaHora: member.proximaHora || proximasHoras[0],
    proximasHoras,
    horariosPublicos: member.horariosPublicos || member.jornadasPublicas || [],
    serviciosAsociados: member.serviciosAsociados || member.servicios || member.services || [],
    portfolioImages: portfolioImages(member),
    fotoUrl: member.fotoUrl || member.foto || member.avatar || fallbackProfessional.fotoUrl,
    colorEspecialidad: member.colorEspecialidad || fallbackProfessional.colorEspecialidad,
    raw: member,
  };
}

export function useProfessionals() {
  const query = useQuery({
    queryKey: ['professionals-public'],
    queryFn: staffService.listPublicStaff,
    ...STAFF_QUERY_OPTIONS,
  });

  const professionals = useMemo(() => {
    const source = Array.isArray(query.data) ? query.data : [];
    return source.map(normalizeProfessional);
  }, [query.data]);

  return {
    ...query,
    professionals,
    isFallback: false,
  };
}

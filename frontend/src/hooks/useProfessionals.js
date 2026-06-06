import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staffService } from '../services/staffService.js';

const MOCKS_ENABLED = import.meta.env.DEV && String(import.meta.env.VITE_USE_MOCKS || '').toLowerCase() === 'true';

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
  return member.idPersona || member.idStaff || member.id || member.idAuth || `${member.nombre}-${member.apellidos}`;
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

export function normalizeProfessional(member, index = 0) {
  const specialty = specialtyName(member, index);
  const rawCargo = member.cargo || member.rol || member.descripcionPerfil || specialty;
  const fallbackProfessional = fallback(index);
  const proximasHoras = member.proximasHoras || member.horasDisponibles || fallbackProfessional.proximasHoras;

  return {
    id: getProfessionalId(member),
    nombre: member.nombre || member.name || fallbackProfessional.nombre,
    apellidos: member.apellidos || fallbackProfessional.apellidos,
    fullName: `${member.nombre || member.name || fallbackProfessional.nombre} ${member.apellidos || fallbackProfessional.apellidos}`.trim(),
    cargo: hasMedicalTerm(rawCargo) ? specialty : rawCargo,
    especialidad: specialty,
    descripcion: member.descripcion || member.bio || member.resumen || fallbackProfessional.descripcion,
    sucursal: member.sucursal || member.sede || fallbackProfessional.sucursal,
    modalidad: member.modalidad || fallbackProfessional.modalidad,
    estado: hasMedicalTerm(member.estado) ? fallbackProfessional.estado : member.estado || fallbackProfessional.estado,
    proximaHora: member.proximaHora || proximasHoras[0],
    proximasHoras,
    fotoUrl: member.fotoUrl || member.foto || member.avatar || fallbackProfessional.fotoUrl,
    colorEspecialidad: member.colorEspecialidad || fallbackProfessional.colorEspecialidad,
    raw: member,
  };
}

export function useProfessionals() {
  const query = useQuery({
    queryKey: ['professionals-public'],
    queryFn: staffService.listPublicStaff,
    staleTime: 1000 * 60 * 5,
  });
  const mockQuery = useQuery({
    queryKey: ['professionals-public-mock'],
    queryFn: async () => {
      if (!MOCKS_ENABLED) return [];
      const module = await import('../mocks/professionals.mock.js');
      return module.mockProfessionals;
    },
    enabled: MOCKS_ENABLED && !(Array.isArray(query.data) && query.data.length),
    staleTime: Infinity,
  });

  const professionals = useMemo(() => {
    const source = Array.isArray(query.data) && query.data.length
      ? query.data
      : MOCKS_ENABLED && Array.isArray(mockQuery.data) ? mockQuery.data : [];
    return source.map(normalizeProfessional);
  }, [mockQuery.data, query.data]);

  return {
    ...query,
    isLoading: query.isLoading || (MOCKS_ENABLED && mockQuery.isLoading && !(Array.isArray(query.data) && query.data.length)),
    professionals,
    isFallback: MOCKS_ENABLED && Array.isArray(mockQuery.data) && !(Array.isArray(query.data) && query.data.length),
  };
}

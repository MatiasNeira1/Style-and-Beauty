import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockProfessionals } from '../mocks/professionals.mock.js';
import { profileService } from '../services/profileService.js';

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

function fallback(index) {
  return mockProfessionals[index % mockProfessionals.length];
}

function specialtyName(member, index) {
  const value = member.especialidad?.nombre || member.especialidad || member.rol || member.cargo || fallback(index).especialidad;
  return hasMedicalTerm(value) ? fallback(index).especialidad : value;
}

export function normalizeProfessional(member, index = 0) {
  const specialty = specialtyName(member, index);
  const rawCargo = member.cargo || member.rol || specialty;
  const fallbackProfessional = fallback(index);
  const proximasHoras = member.proximasHoras || member.horasDisponibles || fallbackProfessional.proximasHoras;

  return {
    id: getProfessionalId(member),
    nombre: member.nombre || member.name || fallbackProfessional.nombre,
    apellidos: member.apellidos || fallbackProfessional.apellidos,
    fullName: `${member.nombre || member.name || fallbackProfessional.nombre} ${member.apellidos || fallbackProfessional.apellidos}`.trim(),
    cargo: hasMedicalTerm(rawCargo) ? specialty : rawCargo,
    especialidad: specialty,
    descripcion: member.descripcionPerfil || member.descripcion || member.bio || member.resumen || fallbackProfessional.descripcion,
    trayectoria: member.descripcionPerfil || member.trayectoria || fallbackProfessional.trayectoria,
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
    queryFn: profileService.listPublicStaff,
    staleTime: 1000 * 60 * 5,
  });

  const professionals = useMemo(() => {
    const source = Array.isArray(query.data) && query.data.length ? query.data : mockProfessionals;
    return source.map(normalizeProfessional);
  }, [query.data]);

  return {
    ...query,
    professionals,
    isFallback: !(Array.isArray(query.data) && query.data.length),
  };
}

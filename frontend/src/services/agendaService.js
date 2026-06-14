import { AGENDA_API_BASE_URL, request } from './apiClient.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export function crearCita(payload) {
  if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para reservar.');
  if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para reservar.');
  requireValue(payload?.fechaHoraInicio, 'Selecciona un horario disponible para reservar.');

  return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', authRequired: true, data: payload });
}

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', authRequired: true }),
  createBooking: crearCita,
  crearCita,
  getAvailability: (payload) => {
    if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para consultar disponibilidad.');
    if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fecha, 'Selecciona una fecha para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'GET', params: payload });
  },
  consultarDisponibilidad: (payload) => {
    if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para consultar disponibilidad.');
    if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fecha, 'Selecciona una fecha para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'GET', params: payload });
  },
  consultarDisponibilidadSemanal: (payload) => {
    if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para consultar disponibilidad.');
    if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fechaInicioSemana, 'Selecciona una semana para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad-semanal', method: 'GET', params: payload });
  },
  listarStaffPorServicio: (idServicio) => {
    if (!isValidUuid(idServicio)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${idServicio}/staff`, method: 'GET' });
  },
  obtenerDisponibilidadMensual: (idServicio, idStaff, anio, mes) => {
    if (!isValidUuid(idServicio) || !isValidUuid(idStaff)) return Promise.resolve([]);
    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/servicios/${idServicio}/staff/${idStaff}/disponibilidad-mensual`,
      method: 'GET',
      params: { anio, mes },
    });
  },
  updateBookingStatus: (idCita, payload) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}/estado`, method: 'PATCH', authRequired: true, data: payload }),
  cancelBooking: (idCita) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}`, method: 'DELETE', authRequired: true }),
  listBlocksByStaff: (idStaff) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/bloqueos/staff/${idStaff}`, authRequired: true }),
  createBlock: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/bloqueos', method: 'POST', authRequired: true, data: payload }),
};

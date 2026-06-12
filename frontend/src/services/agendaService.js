import { AGENDA_API_BASE_URL, request } from './apiClient.js';

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export function crearCita(payload) {
  requireValue(payload?.idStaff, 'Selecciona un profesional para reservar.');
  requireValue(payload?.idServicio, 'Selecciona un servicio para reservar.');
  requireValue(payload?.fechaHoraInicio, 'Selecciona un horario disponible para reservar.');

  return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', authRequired: true, data: payload });
}

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', authRequired: true }),
  createBooking: crearCita,
  crearCita,
  getAvailability: (payload) => {
    requireValue(payload?.idStaff, 'Selecciona un profesional para consultar disponibilidad.');
    requireValue(payload?.idServicio, 'Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fecha, 'Selecciona una fecha para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload });
  },
  consultarDisponibilidad: (payload) => {
    requireValue(payload?.idStaff, 'Selecciona un profesional para consultar disponibilidad.');
    requireValue(payload?.idServicio, 'Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fecha, 'Selecciona una fecha para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload });
  },
  consultarDisponibilidadSemanal: (payload) => {
    requireValue(payload?.idStaff, 'Selecciona un profesional para consultar disponibilidad.');
    requireValue(payload?.idServicio, 'Selecciona un servicio para consultar disponibilidad.');
    requireValue(payload?.fechaInicioSemana, 'Selecciona una semana para consultar disponibilidad.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad-semanal', method: 'POST', data: payload });
  },
  listarStaffPorServicio: (idServicio) => {
    if (!idServicio) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${idServicio}/staff`, method: 'GET' });
  },
  obtenerDisponibilidadMensual: (idServicio, idStaff, anio, mes) => request({
    baseURL: AGENDA_API_BASE_URL,
    url: `/api/agenda/servicios/${idServicio}/staff/${idStaff}/disponibilidad-mensual`,
    method: 'GET',
    params: { anio, mes },
  }),
  updateBookingStatus: (idCita, payload) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}/estado`, method: 'PATCH', authRequired: true, data: payload }),
  cancelBooking: (idCita) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}`, method: 'DELETE', authRequired: true }),
  listBlocksByStaff: (idStaff) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/bloqueos/staff/${idStaff}`, authRequired: true }),
  createBlock: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/bloqueos', method: 'POST', authRequired: true, data: payload }),
};

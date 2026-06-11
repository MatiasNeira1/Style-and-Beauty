import { AGENDA_API_BASE_URL, request } from './apiClient.js';

export function crearCita(payload) {
  return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', authRequired: true, data: payload });
}

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', authRequired: true }),
  createBooking: crearCita,
  crearCita,
  getAvailability: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload }),
  consultarDisponibilidad: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload }),
  consultarDisponibilidadSemanal: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad-semanal', method: 'POST', data: payload }),
  listarStaffPorServicio: (idServicio) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${idServicio}/staff`, method: 'GET' }),
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

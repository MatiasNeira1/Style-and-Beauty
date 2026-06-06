import { AGENDA_API_BASE_URL, request } from './apiClient.js';

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', authRequired: true }),
  createBooking: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', authRequired: true, data: payload }),
  getAvailability: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload }),
  listarStaffPorServicio: (idServicio) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${idServicio}/staff`, method: 'GET' }),
  updateBookingStatus: (idCita, payload) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}/estado`, method: 'PATCH', authRequired: true, data: payload }),
  cancelBooking: (idCita) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}`, method: 'DELETE', authRequired: true }),
  listBlocksByStaff: (idStaff) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/bloqueos/staff/${idStaff}`, authRequired: true }),
  createBlock: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/bloqueos', method: 'POST', authRequired: true, data: payload }),
};

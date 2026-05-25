import { AGENDA_API_BASE_URL, request } from './apiClient.js';

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas' }),
  createBooking: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', data: payload }),
  getAvailability: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: payload }),
  updateBookingStatus: (idCita, payload) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}/estado`, method: 'PATCH', data: payload }),
  cancelBooking: (idCita) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}`, method: 'DELETE' }),
  listBlocksByStaff: (idStaff) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/bloqueos/staff/${idStaff}` }),
  createBlock: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/bloqueos', method: 'POST', data: payload }),
};

import { request } from './apiClient.js';

export const agendaService = {
  listBookings: () => request({ url: '/api/agenda/citas' }),
  createBooking: (payload) => request({ url: '/api/agenda/citas', method: 'POST', data: payload }),
  listBlocks: () => request({ url: '/api/agenda/bloqueos' }),
  createBlock: (payload) => request({ url: '/api/agenda/bloqueos', method: 'POST', data: payload }),
  listWorkDays: () => request({ url: '/api/agenda/jornadas' }),
};

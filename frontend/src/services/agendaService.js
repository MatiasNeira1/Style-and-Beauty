import { apiClient } from './apiClient.js';

export const agendaService = {
  listSlots: () => apiClient('/agenda/disponibilidad'),
  createBooking: (payload) => apiClient('/agenda/reservas', { method: 'POST', body: JSON.stringify(payload) }),
};

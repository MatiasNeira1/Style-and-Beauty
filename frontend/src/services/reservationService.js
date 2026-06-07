import { AGENDA_API_BASE_URL, PROFILES_API_BASE_URL, request } from './apiClient.js';

function normalizeAvailabilityPayload({ serviceId, professionalId, date }) {
  return {
    idServicio: serviceId,
    idStaff: professionalId,
    fecha: date,
  };
}

export const reservationService = {
  getMe: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/me', authRequired: true }),

  getAvailability: ({ serviceId, professionalId, date }) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/disponibilidad',
      method: 'POST',
      data: normalizeAvailabilityPayload({ serviceId, professionalId, date }),
    }),

  createReservation: ({ serviceId, professionalId, startsAt, note }) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas',
      method: 'POST',
      authRequired: true,
      data: {
        idServicio: serviceId,
        idStaff: professionalId,
        fechaHoraInicio: startsAt,
        observacionCliente: note,
      },
    }),
};

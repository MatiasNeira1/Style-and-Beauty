import { AGENDA_API_BASE_URL, PROFILES_API_BASE_URL, request } from './apiClient.js';

function normalizeAvailabilityPayload({ serviceId, professionalId, date }) {
  if (!serviceId || !professionalId || !date) {
    throw new Error('Selecciona servicio, profesional y fecha para consultar disponibilidad.');
  }

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

  createReservation: ({ serviceId, professionalId, startsAt, note, clientId }) => {
    if (!clientId) {
      throw new Error('Tu perfil de cliente debe estar completo para confirmar la reserva.');
    }
    if (!serviceId || !professionalId || !startsAt) {
      throw new Error('Selecciona servicio, profesional y horario para continuar.');
    }

    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas',
      method: 'POST',
      authRequired: true,
      data: {
        idCliente: clientId,
        idServicio: serviceId,
        idStaff: professionalId,
        fechaHoraInicio: startsAt,
        observacionCliente: note,
      },
    });
  },

  cancelReservation: (reservationId) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/citas/${reservationId}`,
      method: 'DELETE',
      authRequired: true,
    }),
};

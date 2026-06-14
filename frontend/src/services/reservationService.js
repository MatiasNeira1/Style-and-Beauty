import { AGENDA_API_BASE_URL, PROFILES_API_BASE_URL, request } from './apiClient.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function normalizeAvailabilityPayload({ serviceId, professionalId, date }) {
  if (!isValidUuid(serviceId) || !isValidUuid(professionalId) || !date) {
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
      method: 'GET',
      params: normalizeAvailabilityPayload({ serviceId, professionalId, date }),
    }),

  createReservation: ({ serviceId, professionalId, startsAt, note, clientId }) => {
    if (!clientId) {
      throw new Error('Tu perfil de cliente debe estar completo para confirmar la reserva.');
    }
    if (!isValidUuid(serviceId) || !isValidUuid(professionalId) || !startsAt) {
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
  isValidUuid,
};

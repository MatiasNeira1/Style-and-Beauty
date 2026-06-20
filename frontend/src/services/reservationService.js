import { AGENDA_API_BASE_URL, PROFILES_API_BASE_URL, request } from './apiClient.js';
import { assertBookingDateAllowed } from '../utils/bookingDateRules.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function normalizeAvailabilityPayload({ idServicio, idStaff, fecha, idCliente }) {
  if (!isValidUuid(idServicio) || !isValidUuid(idStaff) || !fecha) {
    throw new Error('Selecciona servicio, profesional y fecha para consultar disponibilidad.');
  }
  assertBookingDateAllowed(fecha);

  const data = {
    idServicio,
    idStaff,
    fecha,
  };
  if (isValidUuid(idCliente)) data.idCliente = idCliente;
  return data;
}

export const reservationService = {
  getMe: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/me', authRequired: true }),

  listMyUpcomingReservations: () =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/mis-proximas',
      authRequired: true,
    }),

  getAvailability: ({ idServicio, idStaff, fecha, idCliente }) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/disponibilidad',
      method: 'POST',
      data: normalizeAvailabilityPayload({ idServicio, idStaff, fecha, idCliente }),
    }),

  createReservation: ({ serviceId, professionalId, startsAt, note, clientId }) => {
    if (!clientId) {
      throw new Error('Tu perfil de cliente debe estar completo para confirmar la reserva.');
    }
    if (!isValidUuid(serviceId) || !isValidUuid(professionalId) || !startsAt) {
      throw new Error('Selecciona servicio, profesional y horario para continuar.');
    }
    assertBookingDateAllowed(startsAt.slice(0, 10));

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

  evaluateReservation: (reservationId, { calificacion, comentario }) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/citas/${reservationId}/evaluar`,
      method: 'POST',
      authRequired: true,
      data: { calificacion, comentario },
    }),

  listFinalized: () =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/mis-citas-finalizadas',
      authRequired: true,
    }),

  isValidUuid,
};

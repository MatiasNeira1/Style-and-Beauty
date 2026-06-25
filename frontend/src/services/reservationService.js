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

function normalizeMultipleAvailabilityPayload({ idCliente, fecha, horaInicial, servicios, maxPlanes = 8 }) {
  if (!fecha || !Array.isArray(servicios) || servicios.length < 2) {
    throw new Error('Selecciona al menos dos servicios y una fecha para consultar disponibilidad.');
  }
  assertBookingDateAllowed(fecha);

  return {
    idCliente,
    fecha,
    horaInicial: horaInicial || undefined,
    maxPlanes,
    servicios: servicios.map((item, index) => {
      const idServicio = item?.idServicio || item?.serviceId || item;
      if (!isValidUuid(idServicio)) throw new Error(`Selecciona el servicio ${index + 1}.`);
      const payload = { idServicio };
      if (isValidUuid(item?.idStaff)) payload.idStaff = item.idStaff;
      if (Number(item?.duracionServicioMin) > 0) payload.duracionServicioMin = Number(item.duracionServicioMin);
      return payload;
    }),
  };
}

function normalizeReservationBatchPayload({ fecha, reservas }) {
  if (!fecha || !Array.isArray(reservas) || reservas.length < 2) {
    throw new Error('Selecciona una agenda múltiple válida para continuar.');
  }
  assertBookingDateAllowed(fecha);

  return {
    fecha,
    reservas: reservas.map((item, index) => {
      if (!isValidUuid(item?.idServicio) || !isValidUuid(item?.idStaff) || !item?.horaInicio) {
        throw new Error(`La reserva ${index + 1} no tiene servicio, profesional u hora validada.`);
      }
      const payload = {
        idServicio: item.idServicio,
        idStaff: item.idStaff,
        horaInicio: item.horaInicio,
        observacionCliente: item.observacionCliente,
      };
      if (Number(item?.duracionServicioMin) > 0) payload.duracionServicioMin = Number(item.duracionServicioMin);
      return payload;
    }),
  };
}

export const reservationService = {
  getMe: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/me', authRequired: true }),

  listMyUpcomingReservations: () =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/mis-proximas',
      authRequired: true,
    }),

  listMyHistoryReservations: () =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/historial',
      authRequired: true,
    }),

  evaluateReservation: (reservationId, ratingOrPayload, comment) => {
    const data = typeof ratingOrPayload === 'object' && ratingOrPayload !== null
      ? {
          calificacion: ratingOrPayload.calificacion,
          comentarioCalificacion: ratingOrPayload.comentarioCalificacion ?? ratingOrPayload.comentario,
        }
      : {
          calificacion: ratingOrPayload,
          comentarioCalificacion: comment,
        };

    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/citas/${reservationId}/evaluar`,
      method: 'POST',
      authRequired: true,
      data,
    });
  },

  getAvailability: ({ idServicio, idStaff, fecha, idCliente }) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/disponibilidad',
      method: 'POST',
      data: normalizeAvailabilityPayload({ idServicio, idStaff, fecha, idCliente }),
    }),

  getMultipleAvailability: (payload) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/disponibilidad-multiple',
      method: 'POST',
      data: normalizeMultipleAvailabilityPayload(payload),
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

  createReservationBatch: (payload) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/lote/cliente',
      method: 'POST',
      authRequired: true,
      data: normalizeReservationBatchPayload(payload),
    }),

  cancelReservation: (reservationId) =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/citas/${reservationId}`,
      method: 'DELETE',
      authRequired: true,
    }),

  listFinalized: () =>
    request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/mis-citas-finalizadas',
      authRequired: true,
    }),

  isValidUuid,
};

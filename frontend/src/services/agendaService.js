import { AGENDA_API_BASE_URL, request } from './apiClient.js';
import { assertBookingDateAllowed } from '../utils/bookingDateRules.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function requireDeposit(value, totalAmount) {
  if (value === '' || value === null || value === undefined) {
    throw new Error('Ingresa el abono realizado para continuar.');
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Ingresa el abono realizado para continuar.');
  }
  if (Number(totalAmount) > 0 && amount > Number(totalAmount)) {
    throw new Error('El abono no puede ser mayor al total de la reserva.');
  }
}

function availabilityPayload(payload) {
  const data = {
    idServicio: payload?.idServicio,
    idStaff: payload?.idStaff,
    fecha: payload?.fecha,
  };
  if (Number(payload?.duracionServicioMin) > 0) {
    data.duracionServicioMin = Number(payload.duracionServicioMin);
  }
  if (isValidUuid(payload?.idCliente)) {
    data.idCliente = payload.idCliente;
  }

  if (!isValidUuid(data.idStaff)) throw new Error('Selecciona un profesional para consultar disponibilidad.');
  if (!isValidUuid(data.idServicio)) throw new Error('Selecciona un servicio para consultar disponibilidad.');
  requireValue(data.fecha, 'Selecciona una fecha para consultar disponibilidad.');
  assertBookingDateAllowed(data.fecha);

  return data;
}

function multipleAvailabilityPayload(payload) {
  const data = {
    idCliente: payload?.idCliente,
    fecha: payload?.fecha,
    horaInicial: payload?.horaInicial || undefined,
    maxPlanes: payload?.maxPlanes || 1,
    servicios: Array.isArray(payload?.servicios) ? payload.servicios.map((item, index) => {
      if (!isValidUuid(item?.idServicio)) throw new Error(`Selecciona el servicio ${index + 1}.`);
      if (item?.idStaff && !isValidUuid(item.idStaff)) throw new Error(`Selecciona un profesional valido para el servicio ${index + 1}.`);
      const servicePayload = { idServicio: item.idServicio };
      if (isValidUuid(item?.idStaff)) servicePayload.idStaff = item.idStaff;
      if (Number(item?.duracionServicioMin) > 0) servicePayload.duracionServicioMin = Number(item.duracionServicioMin);
      return servicePayload;
    }) : [],
  };

  if (data.idCliente && !isValidUuid(data.idCliente)) throw new Error('Selecciona un cliente para consultar disponibilidad.');
  requireValue(data.fecha, 'Selecciona una fecha para consultar disponibilidad.');
  assertBookingDateAllowed(data.fecha);
  if (data.servicios.length < 2) throw new Error('Agrega al menos dos servicios para crear una agenda múltiple.');

  return data;
}

function weeklyAvailabilityPayload(payload) {
  const data = {
    idServicio: payload?.idServicio,
    idStaff: payload?.idStaff,
    fecha: payload?.fecha || payload?.fechaInicioSemana,
  };
  if (isValidUuid(payload?.idCliente)) {
    data.idCliente = payload.idCliente;
  }

  if (!isValidUuid(data.idStaff)) throw new Error('Selecciona un profesional para consultar disponibilidad.');
  if (!isValidUuid(data.idServicio)) throw new Error('Selecciona un servicio para consultar disponibilidad.');
  requireValue(data.fecha, 'Selecciona una semana para consultar disponibilidad.');

  return data;
}

export function crearCita(payload) {
  if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para reservar.');
  if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para reservar.');
  requireValue(payload?.fechaHoraInicio, 'Selecciona un horario disponible para reservar.');
  assertBookingDateAllowed(String(payload.fechaHoraInicio).slice(0, 10));

  return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', method: 'POST', authRequired: true, data: payload });
}

export const agendaService = {
  listBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas', authRequired: true }),
  listBookingsByStaff: (staffId) => {
    if (!isValidUuid(staffId)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/staff/${staffId}`, authRequired: true });
  },
  listMyStaffBookings: () => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/mis-citas', authRequired: true }),
  createBooking: crearCita,
  crearCita,
  createAdminBooking: (payload) => {
    if (!isValidUuid(payload?.idCliente)) throw new Error('Selecciona un cliente para reservar.');
    if (!isValidUuid(payload?.idStaff)) throw new Error('Selecciona un profesional para reservar.');
    if (!isValidUuid(payload?.idServicio)) throw new Error('Selecciona un servicio para reservar.');
    requireValue(payload?.fechaHoraInicio, 'Selecciona un horario disponible para reservar.');
    assertBookingDateAllowed(String(payload.fechaHoraInicio).slice(0, 10));
    requireDeposit(payload?.abono, payload?.totalEstimado);

    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/admin',
      method: 'POST',
      authRequired: true,
      data: payload,
    });
  },
  createAdminBookingBatch: (payload) => {
    if (!isValidUuid(payload?.idCliente)) throw new Error('Selecciona un cliente para reservar.');
    requireValue(payload?.fecha, 'Selecciona una fecha para reservar.');
    assertBookingDateAllowed(payload.fecha);
    if (!Array.isArray(payload?.reservas) || payload.reservas.length < 2) {
      throw new Error('Agrega al menos dos servicios para crear una agenda múltiple.');
    }
    requireDeposit(payload?.abono, payload?.totalEstimado);

    const selectedServices = new Set();
    payload.reservas.forEach((booking, index) => {
      if (!isValidUuid(booking?.idServicio)) throw new Error(`Selecciona el servicio ${index + 1}.`);
      if (!isValidUuid(booking?.idStaff)) throw new Error(`Selecciona el profesional del servicio ${index + 1}.`);
      requireValue(booking?.horaInicio, `Selecciona la hora de inicio del servicio ${index + 1}.`);
      if (booking?.duracionServicioMin !== undefined && Number(booking.duracionServicioMin) <= 0) {
        throw new Error(`Selecciona una duración valida para el servicio ${index + 1}.`);
      }
      if (selectedServices.has(booking.idServicio)) {
        throw new Error('La reserva múltiple requiere servicios distintos.');
      }
      selectedServices.add(booking.idServicio);
    });

    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/lote',
      method: 'POST',
      authRequired: true,
      data: payload,
    });
  },
  planificarDisponibilidadMultiple: (payload) => {
    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: '/api/agenda/citas/disponibilidad-multiple',
      method: 'POST',
      data: multipleAvailabilityPayload(payload),
    });
  },
  getAvailability: (payload) => {
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: availabilityPayload(payload) });
  },
  consultarDisponibilidad: (payload) => {
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad', method: 'POST', data: availabilityPayload(payload) });
  },
  consultarDisponibilidadSemanal: (payload) => {
    return request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/citas/disponibilidad-semanal', method: 'POST', data: weeklyAvailabilityPayload(payload) });
  },
  listarStaffPorServicio: (idServicio) => {
    if (!isValidUuid(idServicio)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${idServicio}/staff`, method: 'GET' });
  },
  obtenerDisponibilidadMensual: (idServicio, idStaff, anio, mes) => {
    if (!isValidUuid(idServicio) || !isValidUuid(idStaff)) return Promise.resolve([]);
    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/servicios/${idServicio}/staff/${idStaff}/disponibilidad-mensual`,
      method: 'GET',
      params: { anio, mes },
    });
  },
  updateBookingStatus: (idCita, payload) => {
    if (!isValidUuid(idCita)) throw new Error('La reserva seleccionada no es valida.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}/estado`, method: 'PATCH', authRequired: true, data: payload });
  },
  finalizeMyBooking: (idCita) => {
    if (!isValidUuid(idCita)) throw new Error('La reserva seleccionada no es valida.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/mis-citas/${idCita}/finalizar`, method: 'PATCH', authRequired: true });
  },
  cancelBooking: (idCita) => {
    if (!isValidUuid(idCita)) throw new Error('La reserva seleccionada no es valida.');
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/citas/${idCita}`, method: 'DELETE', authRequired: true });
  },
  listBlocksByStaff: (idStaff) => {
    if (!isValidUuid(idStaff)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/bloqueos/staff/${idStaff}`, authRequired: true });
  },
  createBlock: (payload) => request({ baseURL: AGENDA_API_BASE_URL, url: '/api/agenda/bloqueos', method: 'POST', authRequired: true, data: payload }),
  isValidUuid,
};

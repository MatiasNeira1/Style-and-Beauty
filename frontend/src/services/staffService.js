import { AGENDA_API_BASE_URL, PROFILES_API_BASE_URL, request } from './apiClient.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function imageFormData(file) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

export const staffService = {
  listPublicStaff: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/staff', method: 'GET' }),

  listStaff: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/staff', method: 'GET', authRequired: true }),

  getStaffById: (id) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/perfiles/staff/${id}`, method: 'GET' }),

  createStaff: (payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', authRequired: true, data: { ...payload, tipoPerfil: 'STAFF' } }),

  updateStaff: (idAuth, payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/actualizar/${idAuth}`, method: 'PUT', authRequired: true, data: payload }),

  updateSelf: (payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/actualizar', method: 'PUT', authRequired: true, data: payload }),

  deleteStaff: (idAuth) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/eliminar/${idAuth}`, method: 'DELETE', authRequired: true }),

  uploadStaffPhoto: (staffId, file) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/profesionales/${staffId}/foto`, method: 'POST', authRequired: true, data: imageFormData(file) }),

  deleteStaffPhoto: (staffId) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/profesionales/${staffId}/foto`, method: 'DELETE', authRequired: true }),

  updateStaffStatus: (staffId, active) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/profesionales/${staffId}/estado/${Boolean(active)}`, method: 'PATCH', authRequired: true }),

  listSpecialties: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/especialidades', method: 'GET' }),

  listSchedules: (staffId) => {
    if (!isValidUuid(staffId)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/jornadas/staff/${staffId}`, method: 'GET', authRequired: true });
  },

  saveSchedules: (staffId, jornadas) => {
    if (!isValidUuid(staffId)) return Promise.reject(new Error('Selecciona un profesional valido para guardar jornadas.'));
    return request({
      baseURL: AGENDA_API_BASE_URL,
      url: `/api/agenda/jornadas/staff/${staffId}`,
      method: 'PUT',
      authRequired: true,
      data: jornadas.map((jornada) => ({ ...jornada, idStaff: staffId })),
    });
  },

  listPortfolio: (staffId) => {
    if (!isValidUuid(staffId)) return Promise.resolve([]);
    return request({ baseURL: PROFILES_API_BASE_URL, url: `/api/perfiles/staff/${staffId}/portfolio`, method: 'GET' });
  },

  uploadPortfolioImage: (staffId, file) => {
    if (!isValidUuid(staffId)) return Promise.reject(new Error('Selecciona un profesional valido para subir imagenes.'));
    return request({ baseURL: PROFILES_API_BASE_URL, url: `/api/perfiles/staff/${staffId}/portfolio`, method: 'POST', authRequired: true, data: imageFormData(file) });
  },

  deletePortfolioImage: (staffId, imageId) => {
    if (!isValidUuid(staffId) || !isValidUuid(imageId)) return Promise.reject(new Error('Selecciona una imagen de portfolio valida.'));
    return request({ baseURL: PROFILES_API_BASE_URL, url: `/api/perfiles/staff/${staffId}/portfolio/${imageId}`, method: 'DELETE', authRequired: true });
  },

  isValidUuid,
};

import { PROFILES_API_BASE_URL, STAFF_API_BASE_URL, request } from './apiClient.js';

export const staffService = {
  listPublicStaff: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/staff', method: 'GET' }),

  // ── Staff CRUD ──────────────────────────────────────
  listStaff: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/staff', method: 'GET', authRequired: true }),

  getStaffById: (id) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/perfiles/staff/${id}`, method: 'GET' }),

  createStaff: (payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', authRequired: true, data: { ...payload, tipoPerfil: 'STAFF' } }),

  updateStaff: (idAuth, payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/actualizar/${idAuth}`, method: 'PUT', authRequired: true, data: payload }),

  deleteStaff: (idAuth) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/eliminar/${idAuth}`, method: 'DELETE', authRequired: true }),

  // ── Especialidades ─────────────────────────────────
  listSpecialties: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/especialidades', method: 'GET', authRequired: true }),

  // ── Jornadas Laborales ─────────────────────────────
  listSchedules: (staffId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/jornadas`, method: 'GET', authRequired: true }),

  saveSchedules: (staffId, jornadas) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/jornadas`, method: 'POST', authRequired: true, data: jornadas }),

  // ── Portfolio (Fotos de trabajos) ──────────────────
  listPortfolio: (staffId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/portfolio`, method: 'GET', authRequired: true }),

  uploadPortfolioImage: (staffId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request({
      baseURL: STAFF_API_BASE_URL,
      url: `/api/staff/${staffId}/portfolio`,
      method: 'POST',
      authRequired: true,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePortfolioImage: (staffId, imageId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/portfolio/${imageId}`, method: 'DELETE', authRequired: true }),
};

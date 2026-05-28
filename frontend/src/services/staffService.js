import { PROFILES_API_BASE_URL, STAFF_API_BASE_URL, request } from './apiClient.js';

export const staffService = {
  // ── Staff CRUD ──────────────────────────────────────
  listStaff: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/staff', method: 'GET' }),

  getStaffById: (id) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${id}`, method: 'GET' }),

  createStaff: (payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', data: { ...payload, tipoPerfil: 'STAFF' } }),

  updateStaff: (idAuth, payload) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/actualizar/${idAuth}`, method: 'PUT', data: payload }),

  deleteStaff: (idAuth) =>
    request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/eliminar/${idAuth}`, method: 'DELETE' }),

  // ── Especialidades ─────────────────────────────────
  listSpecialties: () =>
    request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/especialidades', method: 'GET' }),

  // ── Jornadas Laborales ─────────────────────────────
  listSchedules: (staffId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/jornadas`, method: 'GET' }),

  saveSchedules: (staffId, jornadas) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/jornadas`, method: 'POST', data: jornadas }),

  // ── Portfolio (Fotos de trabajos) ──────────────────
  listPortfolio: (staffId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/portfolio`, method: 'GET' }),

  uploadPortfolioImage: (staffId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request({
      baseURL: STAFF_API_BASE_URL,
      url: `/api/staff/${staffId}/portfolio`,
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePortfolioImage: (staffId, imageId) =>
    request({ baseURL: STAFF_API_BASE_URL, url: `/api/staff/${staffId}/portfolio/${imageId}`, method: 'DELETE' }),
};

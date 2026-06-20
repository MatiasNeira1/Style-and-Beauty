import { PROFILES_API_BASE_URL, request } from './apiClient.js';

function imageFormData(file) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

export const profileService = {
  validateAvailability: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/validar-disponibilidad', method: 'POST', data: payload }),
  createProfile: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/crear', method: 'POST', authRequired: true, data: payload }),
  getMyProfile: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/me', method: 'GET', authRequired: true }),
  updateMyProfile: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/actualizar', method: 'PUT', authRequired: true, data: payload }),
  uploadMyPhoto: (file) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/me/foto', method: 'POST', authRequired: true, data: imageFormData(file) }),
  listClients: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/clientes', method: 'GET', authRequired: true }),
  listPublicStaff: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/staff', method: 'GET' }),
  listStaff: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/staff', method: 'GET', authRequired: true }),
  listSpecialties: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/especialidades', method: 'GET' }),
  createClient: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', authRequired: true, data: { ...payload, tipoPerfil: 'CLIENTE' } }),
  createStaff: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', authRequired: true, data: { ...payload, tipoPerfil: 'STAFF' } }),
  updateProfileByAuthId: (idAuth, payload) => request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/actualizar/${idAuth}`, method: 'PUT', authRequired: true, data: payload }),
  deleteProfileByAuthId: (idAuth) => request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/eliminar/${idAuth}`, method: 'DELETE', authRequired: true }),
};

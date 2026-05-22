import { PROFILES_API_BASE_URL, request } from './apiClient.js';

export const profileService = {
  createProfile: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/crear', method: 'POST', data: payload }),
  listClients: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/perfiles/clientes', method: 'GET' }),
  listStaff: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/staff', method: 'GET' }),
  listSpecialties: () => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/especialidades', method: 'GET' }),
  createClient: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', data: { ...payload, tipoPerfil: 'CLIENTE' } }),
  createStaff: (payload) => request({ baseURL: PROFILES_API_BASE_URL, url: '/api/admin/crear', method: 'POST', data: { ...payload, tipoPerfil: 'STAFF' } }),
  updateProfileByAuthId: (idAuth, payload) => request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/actualizar/${idAuth}`, method: 'PUT', data: payload }),
  deleteProfileByAuthId: (idAuth) => request({ baseURL: PROFILES_API_BASE_URL, url: `/api/admin/eliminar/${idAuth}`, method: 'DELETE' }),
};

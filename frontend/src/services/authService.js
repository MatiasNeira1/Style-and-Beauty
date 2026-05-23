import { AUTH_API_BASE_URL, request } from './apiClient.js';

export const authService = {
  createUser: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/crear-usuario', method: 'POST', data: payload }),
  registerClient: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/registrar-cliente', method: 'POST', data: payload }),
  assignRole: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/asignar-rol', method: 'POST', data: payload }),
};

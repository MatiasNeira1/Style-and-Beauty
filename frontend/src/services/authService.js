import { request } from './apiClient.js';

export const authService = {
  registerClient: (payload) => request({ url: '/api/auth/registrar-cliente', method: 'POST', data: payload }),
  assignRole: (payload) => request({ url: '/api/auth/asignar-rol', method: 'POST', data: payload }),
};

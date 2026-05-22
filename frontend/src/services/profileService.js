import { request } from './apiClient.js';

export const profileService = {
  createProfile: (payload) => request({ url: '/api/perfiles/crear', method: 'POST', data: payload }),
  getMyProfile: () => request({ url: '/api/perfiles/me', method: 'GET' }),
  updateMyProfile: (payload) => request({ url: '/api/perfiles/actualizar', method: 'PUT', data: payload }),
};

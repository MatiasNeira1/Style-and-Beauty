import { request } from './apiClient.js';

export const profileService = {
  createProfile: (payload) => request({ url: '/api/perfiles/crear', method: 'POST', data: payload }),
};

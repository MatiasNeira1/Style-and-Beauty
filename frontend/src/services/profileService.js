import { apiClient } from './apiClient.js';

export const profileService = {
  getProfile: () => apiClient('/perfiles/me'),
  updateProfile: (payload) => apiClient('/perfiles/me', { method: 'PUT', body: JSON.stringify(payload) }),
};

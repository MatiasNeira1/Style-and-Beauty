import { apiClient } from './apiClient.js';

export const extraService = {
  createRequest: (payload) => apiClient('/extra/solicitudes', { method: 'POST', body: JSON.stringify(payload) }),
};

import { request } from './apiClient.js';

export const catalogService = {
  listServices: () => request({ url: '/api/servicio' }),
};

import { CATALOG_API_BASE_URL, request } from './apiClient.js';

export const catalogService = {
  listServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' }),
  createService: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload }),
  updateService: (idServicio, payload) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}`, method: 'PUT', data: payload }),
  deleteService: (idServicio) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}`, method: 'DELETE' }),
};

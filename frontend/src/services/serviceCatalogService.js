import { AGENDA_API_BASE_URL, CATALOG_API_BASE_URL, request } from './apiClient.js';

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

export const serviceCatalogService = {
  listServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' }),
  getService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}` }),
  listProfessionalsByService: (id) => request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${id}/staff` }),
  createService: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload, authRequired: true }),
  updateService: (id, payload) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'PUT', data: payload, authRequired: true }),
  deleteService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'DELETE', authRequired: true }),
  serviceId,
};

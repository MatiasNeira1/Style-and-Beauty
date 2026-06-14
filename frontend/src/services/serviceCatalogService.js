import { AGENDA_API_BASE_URL, CATALOG_API_BASE_URL, request } from './apiClient.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function imageFormData(file) {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

export const serviceCatalogService = {
  listServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' }),
  getService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}` }),
  listProfessionalsByService: (id) => {
    if (!isValidUuid(id)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${id}/staff` });
  },
  createService: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload, authRequired: true }),
  updateService: (id, payload) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'PUT', data: payload, authRequired: true }),
  deleteService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'DELETE', authRequired: true }),
  uploadServiceImage: (id, file) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicios/${id}/imagen`, method: 'POST', data: imageFormData(file), authRequired: true }),
  deleteServiceImage: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicios/${id}/imagen`, method: 'DELETE', authRequired: true }),
  serviceId,
  isValidUuid,
};

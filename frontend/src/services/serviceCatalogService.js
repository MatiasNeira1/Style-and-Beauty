import { AGENDA_API_BASE_URL, CATALOG_API_BASE_URL, request } from './apiClient.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function imageFormData(file, fields = {}) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  formData.append('file', file);
  return formData;
}

export const serviceCatalogService = {
  listServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' }),
  listAllServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio/admin/todos', authRequired: true }),
  getService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}` }),
  getCategoryCovers: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/categorias/portadas' }),
  uploadCategoryCover: (category, file) => request({
    baseURL: CATALOG_API_BASE_URL,
    url: `/api/categorias/${encodeURIComponent(category)}/portada`,
    method: 'POST',
    data: imageFormData(file),
    authRequired: true,
  }),
  listProfessionalsByService: (id, options = {}) => {
    if (!isValidUuid(id)) return Promise.resolve([]);
    return request({ baseURL: AGENDA_API_BASE_URL, url: `/api/agenda/servicios/${id}/staff`, signal: options.signal });
  },
  listCatalogStaffByService: (id) => {
    if (!isValidUuid(id)) return Promise.resolve([]);
    return request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}/staff`, method: 'GET' });
  },
  assignStaffToService: (idServicio, idStaff) => request({
    baseURL: CATALOG_API_BASE_URL,
    url: '/api/servicio-staff',
    method: 'POST',
    authRequired: true,
    data: { idServicio, idStaff },
  }),
  removeStaffFromService: (idServicio, idStaff) => request({
    baseURL: CATALOG_API_BASE_URL,
    url: `/api/servicio/${idServicio}/staff/${idStaff}`,
    method: 'DELETE',
    authRequired: true,
  }),
  createService: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload, authRequired: true }),
  createServiceWithImage: (payload, file) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: imageFormData(file, payload), authRequired: true }),
  updateService: (id, payload) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'PUT', data: payload, authRequired: true }),
  activateService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}/activar`, method: 'PATCH', authRequired: true }),
  deactivateService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}/desactivar`, method: 'PATCH', authRequired: true }),
  deleteService: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'DELETE', authRequired: true }),
  uploadServiceImage: (id, file) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}/imagen`, method: 'POST', data: imageFormData(file), authRequired: true }),
  deleteServiceImage: (id) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}/imagen`, method: 'DELETE', authRequired: true }),
  serviceId,
  isValidUuid,
};

import { CATALOG_API_BASE_URL, request } from './apiClient.js';

let servicesCache = null;
const serviceByIdCache = new Map();
const servicesByCategoryCache = new Map();

function serviceId(service) {
  return service?.id_servicio || service?.idServicio || service?.id;
}

function clearServiceCache() {
  servicesCache = null;
  serviceByIdCache.clear();
  servicesByCategoryCache.clear();
}

export const serviceCatalogService = {
  listServices: async () => {
    if (servicesCache) return servicesCache;
    const services = await request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' });
    servicesCache = Array.isArray(services) ? services : [];
    return servicesCache;
  },
  getService: async (id) => {
    if (serviceByIdCache.has(id)) return serviceByIdCache.get(id);
    const service = await request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}` });
    serviceByIdCache.set(id, service);
    return service;
  },
  listServicesByCategory: async (categoria) => {
    if (servicesByCategoryCache.has(categoria)) return servicesByCategoryCache.get(categoria);
    const services = await request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/categoria/${categoria}` });
    const normalized = Array.isArray(services) ? services : [];
    servicesByCategoryCache.set(categoria, normalized);
    return normalized;
  },
  createService: async (payload) => {
    const response = await request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload, authRequired: true });
    clearServiceCache();
    return response;
  },
  updateService: async (id, payload) => {
    const response = await request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'PUT', data: payload, authRequired: true });
    clearServiceCache();
    return response;
  },
  deleteService: async (id) => {
    const response = await request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${id}`, method: 'DELETE', authRequired: true });
    clearServiceCache();
    return response;
  },
  serviceId,
};

import { CATALOG_API_BASE_URL, request } from './apiClient.js';
import { serviceCatalogService } from './serviceCatalogService.js';

export const catalogService = {
  listServices: serviceCatalogService.listServices,
  createService: serviceCatalogService.createService,
  updateService: serviceCatalogService.updateService,
  deleteService: serviceCatalogService.deleteService,
  asignarStaffServicio: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio-staff', method: 'POST', authRequired: true, data: payload }),
  listarStaffPorServicio: (idServicio) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff` }),
  validarStaffServicio: (idServicio, idStaff) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff/${idStaff}/validar` }),
  desactivarStaffServicio: (idServicio, idStaff) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff/${idStaff}`, method: 'DELETE', authRequired: true }),
};

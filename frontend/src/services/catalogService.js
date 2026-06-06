import { CATALOG_API_BASE_URL, request } from './apiClient.js';

export const catalogService = {
  listServices: () => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio' }),
  createService: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio', method: 'POST', data: payload }),
  updateService: (idServicio, payload) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}`, method: 'PUT', data: payload }),
  deleteService: (idServicio) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}`, method: 'DELETE' }),
  asignarStaffServicio: (payload) => request({ baseURL: CATALOG_API_BASE_URL, url: '/api/servicio-staff', method: 'POST', data: payload }),
  listarStaffPorServicio: (idServicio) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff` }),
  validarStaffServicio: (idServicio, idStaff) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff/${idStaff}/validar` }),
  desactivarStaffServicio: (idServicio, idStaff) => request({ baseURL: CATALOG_API_BASE_URL, url: `/api/servicio/${idServicio}/staff/${idStaff}`, method: 'DELETE' }),
};

import { apiClient } from './apiClient.js';

export const catalogService = {
  listServices: () => apiClient('/catalogo/servicios'),
  listProducts: () => apiClient('/catalogo/productos'),
};

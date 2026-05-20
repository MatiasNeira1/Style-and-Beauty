import { request } from './apiClient.js';

export const inventoryService = {
  listProducts: () => request({ url: '/api/inventario/productos' }),
  listStock: () => request({ url: '/api/inventario/stock' }),
};

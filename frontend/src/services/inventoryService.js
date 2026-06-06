import { INVENTORY_API_BASE_URL, request } from './apiClient.js';

export const inventoryService = {
  listProducts: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos' }),
  listStock: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock' }),
  createProduct: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos', method: 'POST', data: payload }),
  updateProduct: (idProducto, payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'PUT', data: payload }),
  deactivateProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/desactivar`, method: 'PATCH' }),
  deleteProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'DELETE' }),
  createStock: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock', method: 'POST', data: payload }),
  registerMovement: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/movimientos', method: 'POST', data: payload }),
};

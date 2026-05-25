import { INVENTORY_API_BASE_URL, request } from './apiClient.js';

export const inventoryService = {
  listProducts: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/inventario/productos' }),
  listStock: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/inventario/stock' }),
  createProduct: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/inventario/productos', method: 'POST', data: payload }),
  updateProduct: (idProducto, payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/inventario/productos/${idProducto}`, method: 'PUT', data: payload }),
  deactivateProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/inventario/productos/${idProducto}/desactivar`, method: 'PATCH' }),
  deleteProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/inventario/productos/${idProducto}`, method: 'DELETE' }),
  createStock: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/inventario/stock', method: 'POST', data: payload }),
  registerMovement: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/inventario/movimientos', method: 'POST', data: payload }),
};

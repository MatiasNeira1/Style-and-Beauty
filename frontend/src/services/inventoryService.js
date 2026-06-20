import { INVENTORY_API_BASE_URL, request } from './apiClient.js';

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

export const inventoryService = {
  listProducts: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos' }),
  listStock: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock' }),
  createProduct: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos', method: 'POST', authRequired: true, data: payload }),
  createProductWithImage: (payload, file) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos', method: 'POST', authRequired: true, data: imageFormData(file, payload) }),
  updateProduct: (idProducto, payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'PUT', authRequired: true, data: payload }),
  deactivateProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/desactivar`, method: 'PATCH', authRequired: true }),
  activateProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/activar`, method: 'PATCH', authRequired: true }),
  deleteProduct: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'DELETE', authRequired: true }),
  uploadProductImage: (idProducto, file) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/imagen`, method: 'POST', authRequired: true, data: imageFormData(file) }),
  deleteProductImage: (idProducto) => request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/imagen`, method: 'DELETE', authRequired: true }),
  getCategoryCovers: () => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/categorias/portadas' }),
  uploadCategoryCover: (category, file) => request({
    baseURL: INVENTORY_API_BASE_URL,
    url: `/api/v1/inventarios/categorias/${encodeURIComponent(category)}/portada`,
    method: 'POST',
    authRequired: true,
    data: imageFormData(file),
  }),
  createStock: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock', method: 'POST', authRequired: true, data: payload }),
  registerMovement: (payload) => request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/movimientos', method: 'POST', authRequired: true, data: payload }),
};

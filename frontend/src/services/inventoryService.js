import { INVENTORY_API_BASE_URL, request } from './apiClient.js';

let productsCache = null;
let stockCache = null;

function clearInventoryCache() {
  productsCache = null;
  stockCache = null;
}

export const inventoryService = {
  listProducts: async () => {
    if (productsCache) return productsCache;
    const products = await request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos' });
    productsCache = Array.isArray(products) ? products : [];
    return productsCache;
  },
  listStock: async () => {
    if (stockCache) return stockCache;
    const stock = await request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock' });
    stockCache = Array.isArray(stock) ? stock : [];
    return stockCache;
  },
  createProduct: async (payload) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/productos', method: 'POST', data: payload });
    clearInventoryCache();
    return response;
  },
  updateProduct: async (idProducto, payload) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'PUT', data: payload });
    clearInventoryCache();
    return response;
  },
  deactivateProduct: async (idProducto) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}/desactivar`, method: 'PATCH' });
    clearInventoryCache();
    return response;
  },
  deleteProduct: async (idProducto) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: `/api/v1/inventarios/productos/${idProducto}`, method: 'DELETE' });
    clearInventoryCache();
    return response;
  },
  createStock: async (payload) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/stock', method: 'POST', data: payload });
    clearInventoryCache();
    return response;
  },
  registerMovement: async (payload) => {
    const response = await request({ baseURL: INVENTORY_API_BASE_URL, url: '/api/v1/inventarios/movimientos', method: 'POST', data: payload });
    clearInventoryCache();
    return response;
  },
};

import { apiClient } from './apiClient.js';

export const inventoryService = {
  listInventory: () => apiClient('/inventario'),
};

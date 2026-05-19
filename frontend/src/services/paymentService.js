import { apiClient } from './apiClient.js';

export const paymentService = {
  createPayment: (payload) => apiClient('/pagos', { method: 'POST', body: JSON.stringify(payload) }),
};

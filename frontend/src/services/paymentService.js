import { API_BASE_URL, request } from './apiClient.js';

export const paymentService = {
  listTransactions: () => request({ baseURL: API_BASE_URL, url: '/api/pagos/transacciones', method: 'GET', authRequired: true }),
  createPayment: (payload) => request({ baseURL: API_BASE_URL, url: '/api/pagos/transacciones', method: 'POST', authRequired: true, data: payload }),
};

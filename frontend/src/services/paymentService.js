import { request } from './apiClient.js';

export const paymentService = {
  listTransactions: () => request({ url: '/api/pagos/transacciones', authRequired: true }),
  createPayment: (payload) => request({ url: '/api/pagos/transacciones', method: 'POST', authRequired: true, data: payload }),
};

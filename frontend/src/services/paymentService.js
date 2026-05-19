import { request } from './apiClient.js';

export const paymentService = {
  listTransactions: () => request({ url: '/api/pagos/transacciones' }),
  createPayment: (payload) => request({ url: '/api/pagos/transacciones', method: 'POST', data: payload }),
};

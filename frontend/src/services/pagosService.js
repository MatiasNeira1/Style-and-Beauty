import { API_BASE_URL, request } from './apiClient.js';

const PAGOS_API_BASE_URL =
  (import.meta.env.VITE_PAGOS_API_BASE_URL || API_BASE_URL)
    .replace(/\/$/, '')
    .replace(/\/api$/i, '');

export async function crearTransaccionWebpay(payload) {
  return request({
    baseURL: PAGOS_API_BASE_URL,
    url: '/api/pagos/webpay/crear',
    method: 'POST',
    data: payload,
  });
}

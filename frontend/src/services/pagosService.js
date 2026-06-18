import { API_BASE_URL, request } from './apiClient.js';

export async function crearTransaccionWebpay(payload) {
  return request({
    baseURL: API_BASE_URL,
    url: '/api/pagos/webpay/crear',
    method: 'POST',
    data: payload,
  });
}

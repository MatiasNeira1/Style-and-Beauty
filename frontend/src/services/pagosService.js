import { API_BASE_URL } from './apiClient.js';

const PAGOS_API_BASE_URL =
  (import.meta.env.VITE_PAGOS_API_BASE_URL || API_BASE_URL)
    .replace(/\/$/, '')
    .replace(/\/api$/i, '');

export async function crearTransaccionWebpay(payload) {
  const response = await fetch(
    `${PAGOS_API_BASE_URL}/api/pagos/webpay/crear`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear transaccion Webpay');
  }

  return response.json();
}

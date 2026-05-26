import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:8081';
export const PROFILES_API_BASE_URL = import.meta.env.VITE_PROFILES_API_BASE_URL || 'http://localhost:8082';
export const STAFF_API_BASE_URL = import.meta.env.VITE_STAFF_API_BASE_URL || 'http://localhost:8083';
export const CATALOG_API_BASE_URL = import.meta.env.VITE_CATALOG_API_BASE_URL || API_BASE_URL;
export const AGENDA_API_BASE_URL = import.meta.env.VITE_AGENDA_API_BASE_URL || API_BASE_URL;
export const INVENTORY_API_BASE_URL = import.meta.env.VITE_INVENTORY_API_BASE_URL || API_BASE_URL;
export const TOKEN_KEY = 'style_beauty_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response || error.code === 'ERR_NETWORK') {
      const networkError = new Error('No se pudo conectar con el servidor. Verifica que el backend esté iniciado.');
      networkError.code = error.code || 'ERR_NETWORK';
      throw networkError;
    }

    const responseData = error.response?.data;
    const rawMessage =
      responseData?.message ||
      responseData?.error ||
      (typeof responseData === 'string' ? responseData : null) ||
      error.message ||
      'Error de comunicación con el servidor';
    const normalizedMessage = rawMessage.toLowerCase();
    let message = rawMessage;

    if (normalizedMessage.includes('correo') && (normalizedMessage.includes('existe') || normalizedMessage.includes('registrado'))) {
      message = 'Este email ya está registrado.';
    } else if (normalizedMessage.includes('obligatorio') || normalizedMessage.includes('requerido')) {
      message = 'Completa todos los campos obligatorios.';
    }

    const apiError = new Error(message);
    apiError.status = error.response.status;
    apiError.code = error.code;
    apiError.data = responseData;
    throw apiError;
  },
);

export async function request(config) {
  const response = await apiClient(config);
  return response.data;
}

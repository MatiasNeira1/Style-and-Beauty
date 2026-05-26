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
    const responseData = error.response?.data;
    const message = responseData?.message || (typeof responseData === 'string' ? responseData : null) || error.message || 'Error de comunicacion con el servidor';
    return Promise.reject(new Error(message));
  },
);

export async function request(config) {
  const response = await apiClient(config);
  return response.data;
}

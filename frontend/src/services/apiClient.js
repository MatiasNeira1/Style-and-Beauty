import axios from 'axios';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '').replace(/\/api$/i, '');
export const AUTH_API_BASE_URL = API_BASE_URL;
export const PROFILES_API_BASE_URL = API_BASE_URL;
export const STAFF_API_BASE_URL = API_BASE_URL;
export const CATALOG_API_BASE_URL = API_BASE_URL;
export const AGENDA_API_BASE_URL = API_BASE_URL;
export const INVENTORY_API_BASE_URL = API_BASE_URL;
export const TOKEN_KEY = 'style_beauty_token';
export const SESSION_USER_KEY = 'style_beauty_user';
export const AUTH_EXPIRED_EVENT = 'style-beauty:auth-expired';
export const ASSETS_BASE_URL = (import.meta.env.VITE_ASSETS_BASE_URL || '').replace(/\/$/, '');
export const USE_MOCKS = import.meta.env.DEV && String(import.meta.env.VITE_USE_MOCKS || '').toLowerCase() === 'true';
export const DEFAULT_IMAGE_FALLBACK = '/logo.jpg';

const AUTH_STORAGE_KEYS = [
  TOKEN_KEY,
  SESSION_USER_KEY,
  'style_beauty_access_token',
  'style_beauty_refresh_token',
  'accessToken',
  'refreshToken',
  'authToken',
  'token',
];

export class AuthRequiredError extends Error {
  constructor(message = 'Debes iniciar sesión para continuar.') {
    super(message);
    this.name = 'AuthRequiredError';
    this.status = 401;
    this.code = 'AUTH_REQUIRED';
  }
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
  });
}

function redirectToLoginAfterAuthFailure() {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  if (currentPath === '/login' || currentPath === '/registro') return;

  window.setTimeout(() => {
    window.location.replace('/login');
  }, 0);
}

export function resolveAssetUrl(src, fallback = '') {
  const value = String(src || '').trim();
  if (!value) return fallback;
  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith('/')) return value;
  return ASSETS_BASE_URL ? `${ASSETS_BASE_URL}/${value.replace(/^\/+/, '')}` : value;
}

export function requireSession() {
  const token = getAuthToken();
  if (!token) {
    throw new AuthRequiredError();
  }
  return token;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response || error.code === 'ERR_NETWORK') {
      const networkError = new Error('Servicio temporalmente no disponible.');
      networkError.code = error.code || 'ERR_NETWORK';
      throw networkError;
    }

    if (error.response.status === 401) {
      clearStoredSession();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      redirectToLoginAfterAuthFailure();
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
  const { authRequired, ...axiosConfig } = config;
  if (authRequired) {
    requireSession();
  }
  const response = await apiClient(axiosConfig);
  return response.data;
}

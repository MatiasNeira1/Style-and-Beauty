import axios from 'axios';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const PUBLIC_GATEWAY_FALLBACK = 'https://sb-gateway.bluerock-c41dfa74.brazilsouth.azurecontainerapps.io';

function isInternalAzureUrl(value) {
  return String(value || '').toLowerCase().includes('.internal.');
}

function normalizeApiBaseUrl(value, fallback = '') {
  const candidate = String(value || '').trim();
  if (!candidate) return fallback;
  if (isInternalAzureUrl(candidate)) return fallback || PUBLIC_GATEWAY_FALLBACK;
  return candidate.replace(/\/$/, '').replace(/\/api$/i, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
export const AUTH_API_BASE_URL = API_BASE_URL;
export const PROFILES_API_BASE_URL = API_BASE_URL;
export const STAFF_API_BASE_URL = API_BASE_URL;
export const CATALOG_API_BASE_URL = API_BASE_URL;
export const AGENDA_API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_AGENDA_API_BASE_URL, API_BASE_URL);
export const INVENTORY_API_BASE_URL = API_BASE_URL;
export const TOKEN_KEY = 'style_beauty_token';
export const SESSION_USER_KEY = 'style_beauty_user';
export const AUTH_EXPIRED_EVENT = 'style-beauty:auth-expired';
export const ASSETS_BASE_URL = (import.meta.env.VITE_ASSETS_BASE_URL || '').replace(/\/$/, '');
export const AZURE_PUBLIC_LOGO_URL = 'https://stylebeautyimages.blob.core.windows.net/stylebeauty/logo.jpg';
export const AZURE_PUBLIC_STAFF_IMAGE_URL = 'https://stylebeautyimages.blob.core.windows.net/stylebeauty/jefes.png';
export const HOME_HERO_IMAGE_URL = import.meta.env.VITE_HOME_HERO_IMAGE_URL || AZURE_PUBLIC_STAFF_IMAGE_URL;
export const USE_MOCKS = import.meta.env.DEV && String(import.meta.env.VITE_USE_MOCKS || '').toLowerCase() === 'true';
export const DEFAULT_IMAGE_FALLBACK = AZURE_PUBLIC_LOGO_URL;

const AUTH_STORAGE_KEYS = [
  TOKEN_KEY,
  SESSION_USER_KEY,
  'style_beauty_access_token',
  'style_beauty_refresh_token',
  'accessToken',
  'refreshToken',
  'authToken',
  'token',
  'style_beauty_pending_profile',
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

export function isProfileNotFoundError(error) {
  const data = error?.data;
  const code = String(error?.code || data?.code || data?.error || '').toUpperCase();
  const message = String(error?.message || data?.message || (typeof data === 'string' ? data : '') || '').toLowerCase();

  return code === 'PROFILE_NOT_FOUND'
    || message.includes('perfil no encontrado')
    || message.includes('no tiene perfil asociado');
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
  if (isInternalAzureUrl(config.baseURL)) {
    config.baseURL = API_BASE_URL || PUBLIC_GATEWAY_FALLBACK;
  }

  if (isInternalAzureUrl(config.url)) {
    throw new Error('La URL de API apunta a un dominio interno no permitido.');
  }

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_CANCELED' || axios.isCancel?.(error)) {
      const canceledError = new Error('Consulta cancelada.');
      canceledError.name = 'AbortError';
      canceledError.code = 'ERR_CANCELED';
      throw canceledError;
    }

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

    if (normalizedMessage.includes('rut') && (normalizedMessage.includes('registrado') || normalizedMessage.includes('existe'))) {
      message = 'El RUT ingresado ya se encuentra registrado.';
    } else if (normalizedMessage.includes('rut') && (normalizedMessage.includes('válido') || normalizedMessage.includes('valido') || normalizedMessage.includes('obligatorio'))) {
      message = rawMessage;
    } else if (normalizedMessage.includes('correo') && (normalizedMessage.includes('existe') || normalizedMessage.includes('registrado'))) {
      message = 'Este email ya está registrado.';
    } else if (normalizedMessage.includes('obligatorio') || normalizedMessage.includes('requerido')) {
      message = 'Completa todos los campos obligatorios.';
    }

    const apiError = new Error(message);
    apiError.status = error.response.status;
    apiError.code = responseData?.code || error.code;
    apiError.field = responseData?.field;
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

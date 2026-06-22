import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_EXPIRED_EVENT, clearStoredSession, SESSION_USER_KEY, TOKEN_KEY } from '../services/apiClient.js';
import { authService } from '../services/authService.js';
import { firebaseAuth } from '../services/firebaseClient.js';
import { firebaseAuthService } from '../services/firebaseAuthService.js';
import { profileService } from '../services/profileService.js';
import { normalizeRut, validateRut } from '../utils/rutUtils.js';

const AuthContext = createContext(null);
const ROLE_CLAIM_RETRIES = 10;
const ROLE_CLAIM_RETRY_DELAY_MS = 900;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isClientRole(session) {
  const role = session?.claims?.rol || session?.claims?.role || session?.user?.rol || session?.user?.role;
  return String(role || '').toUpperCase() === 'CLIENTE';
}

function withClientFallback(session) {
  if (!session?.user) return session;
  return {
    ...session,
    user: {
      ...session.user,
      rol: 'CLIENTE',
      role: 'cliente',
    },
    claims: {
      ...(session.claims || {}),
      rol: 'CLIENTE',
      role: 'CLIENTE',
    },
  };
}

function readStoredUser() {
  try {
    const stored = window.localStorage.getItem(SESSION_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUserState] = useState(readStoredUser);
  const isRegisteringRef = useRef(false);

  const setSession = useCallback((session) => {
    if (!session?.user) {
      clearStoredSession();
      queryClient.clear();
      setUserState(null);
      return;
    }

    if (session.token) {
      window.localStorage.setItem(TOKEN_KEY, session.token);
    }
    window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user));
    setUserState(session.user);
  }, [queryClient]);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null);
        setIsAuthReady(true);
        return;
      }

      if (isRegisteringRef.current) {
        setIsAuthReady(true);
        return;
      }

      try {
        const session = await firebaseAuthService.refreshSession(firebaseUser);
        setSession(session);
      } catch (err) {
        console.error('Auth refresh failed', err);
        setSession(null);
      } finally {
        setIsAuthReady(true);
      }
    });
  }, [setSession]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setSession(null);
      firebaseAuthService.logout().catch((err) => {
        console.error('Firebase logout after auth failure failed', err);
      });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [setSession]);

  const login = useCallback(async (email, password) => {
    const session = await firebaseAuthService.login(email, password);
    setSession(session);
    return session;
  }, [setSession]);

  const registerClient = useCallback(async ({ email, password, profile }) => {
    isRegisteringRef.current = true;
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedRut = normalizeRut(profile.rut);
      if (!normalizedRut) {
        throw new Error('El RUT es obligatorio.');
      }
      if (!validateRut(normalizedRut)) {
        throw new Error('Ingresa un RUT válido.');
      }
      const normalizedProfile = {
        ...profile,
        rut: normalizedRut,
        emailContacto: (profile.emailContacto || normalizedEmail).trim().toLowerCase(),
        genero: profile.genero?.trim().toLowerCase(),
        tipoPerfil: 'CLIENTE',
      };

      try {
        window.localStorage.setItem('style_beauty_pending_profile', JSON.stringify(normalizedProfile));
        window.sessionStorage.setItem('style_beauty_pending_profile', JSON.stringify(normalizedProfile));
      } catch (storageErr) {
        console.warn('Failed to save pending profile to storage in AuthContext:', storageErr);
      }

      await profileService.validateAvailability(normalizedProfile);
      const created = await firebaseAuthService.register(normalizedEmail, password);
      if (created.token) {
        window.localStorage.setItem(TOKEN_KEY, created.token);
      }
      await authService.registerClient({ uid: created.user.uid });
      const clientClaimSession = await firebaseAuthService.refreshSession();
      if (clientClaimSession?.token) {
        window.localStorage.setItem(TOKEN_KEY, clientClaimSession.token);
      }

      try {
        await profileService.createProfile(normalizedProfile);
      } catch (profileError) {
        const message = profileError.message?.toLowerCase() || '';
        if (message.includes('ya existe un perfil') || message.includes('ya existe un usuario')) {
          await profileService.getMyProfile();
        } else {
          await firebaseAuthService.logout().catch(() => {});
          setSession(null);
          throw profileError;
        }
      }

      let session = null;
      for (let attempt = 1; attempt <= ROLE_CLAIM_RETRIES; attempt += 1) {
        session = await firebaseAuthService.refreshSession();
        if (isClientRole(session)) break;
        await wait(ROLE_CLAIM_RETRY_DELAY_MS);
      }

      if (!isClientRole(session)) {
        await authService.registerClient({ uid: created.user.uid });
        session = withClientFallback(session || {
          user: created.user,
          token: created.token,
          claims: {},
        });
      }

      setSession(session);
      return session;
    } finally {
      isRegisteringRef.current = false;
    }
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await firebaseAuthService.logout();
    } finally {
      setSession(null);
    }
  }, [setSession]);

  const value = useMemo(
    () => ({ user, login, registerClient, setSession, logout, isAuthenticated: Boolean(user), isAuthReady }),
    [user, login, registerClient, setSession, logout, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{isAuthReady ? children : null}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

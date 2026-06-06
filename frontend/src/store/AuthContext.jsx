import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_EXPIRED_EVENT, clearStoredSession, SESSION_USER_KEY, TOKEN_KEY } from '../services/apiClient.js';
import { authService } from '../services/authService.js';
import { firebaseAuth } from '../services/firebaseClient.js';
import { firebaseAuthService } from '../services/firebaseAuthService.js';
import { profileService } from '../services/profileService.js';

const AuthContext = createContext(null);
const ROLE_CLAIM_RETRIES = 6;
const ROLE_CLAIM_RETRY_DELAY_MS = 700;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    await profileService.validateAvailability({ ...profile, tipoPerfil: 'CLIENTE' });
    const created = await firebaseAuthService.register(email, password);
    await authService.registerClient({ uid: created.user.uid });

    let session = null;
    for (let attempt = 1; attempt <= ROLE_CLAIM_RETRIES; attempt += 1) {
      session = await firebaseAuthService.refreshSession();
      if (session?.user?.rol === 'CLIENTE') break;
      await wait(ROLE_CLAIM_RETRY_DELAY_MS);
    }

    if (session?.user?.rol !== 'CLIENTE') {
      throw new Error('La cuenta se creó, pero el rol CLIENTE aún no está disponible. Intenta iniciar sesión nuevamente.');
    }

    setSession(session);
    await profileService.createProfile(profile);
    return session;
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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { TOKEN_KEY } from '../services/apiClient.js';
import { authService } from '../services/authService.js';
import { firebaseAuth } from '../services/firebaseClient.js';
import { firebaseAuthService } from '../services/firebaseAuthService.js';
import { profileService } from '../services/profileService.js';

const AuthContext = createContext(null);
const USER_KEY = 'style_beauty_user';

export function AuthProvider({ children }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUserState] = useState(() => {
    const stored = window.localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const setSession = useCallback((session) => {
    if (!session?.user) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      setUserState(null);
      return;
    }

    if (session.token) {
      window.localStorage.setItem(TOKEN_KEY, session.token);
    }
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setUserState(session.user);
  }, []);

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
        console.error("Auth Refresh Failed", err);
        setSession(null);
      } finally {
        setIsAuthReady(true);
      }
    });
  }, [setSession]);

  const login = useCallback(async (email, password) => {
    const session = await firebaseAuthService.login(email, password);
    setSession(session);
    return session;
  }, [setSession]);

  const registerClient = async ({ email, password, profile }) => {
    await profileService.validateAvailability({ ...profile, tipoPerfil: 'CLIENTE' });

  const registerClient = useCallback(async ({ email, password, profile }) => {
    const created = await firebaseAuthService.register(email, password);
    await authService.registerClient({ uid: created.user.uid });
    const session = await firebaseAuthService.refreshSession();
    setSession(session);
    await profileService.createProfile(profile);
    return session;
  }, [setSession]);

  const logout = useCallback(async () => {
    await firebaseAuthService.logout();
    setSession(null);
  }, [setSession]);

  const value = useMemo(
    () => ({ user, login, registerClient, setSession, logout, isAuthenticated: Boolean(user), isAuthReady }),
    [user, login, registerClient, setSession, logout, isAuthReady]
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

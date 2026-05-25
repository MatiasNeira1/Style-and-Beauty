import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  const setSession = ({ user: nextUser, token }) => {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUserState(nextUser || null);
  };

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setUserState(null);
        setIsAuthReady(true);
        return;
      }

      try {
        const session = await firebaseAuthService.refreshSession(firebaseUser);
        setSession(session);
      } finally {
        setIsAuthReady(true);
      }
    });
  }, []);

  const login = async (email, password) => {
    const session = await firebaseAuthService.login(email, password);
    setSession(session);
    return session;
  };

  const registerClient = async ({ email, password, profile }) => {
    await profileService.validateAvailability({ ...profile, tipoPerfil: 'CLIENTE' });

    const created = await firebaseAuthService.register(email, password);

    await authService.registerClient({ uid: created.user.uid });

    const session = await firebaseAuthService.refreshSession();
    setSession(session);

    await profileService.createProfile(profile);
    return session;
  };

  const logout = async () => {
    await firebaseAuthService.logout();
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUserState(null);
  };

  const value = useMemo(
    () => ({ user, login, registerClient, setSession, logout, isAuthenticated: Boolean(user), isAuthReady }),
    [user, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

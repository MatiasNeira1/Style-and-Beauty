import { createContext, useContext, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../services/apiClient.js';

const AuthContext = createContext(null);
const USER_KEY = 'style_beauty_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const stored = window.localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const setSession = ({ user: nextUser, token }) => {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUserState(nextUser || null);
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUserState(null);
  };

  const value = useMemo(
    () => ({ user, setSession, logout, isAuthenticated: Boolean(user) }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

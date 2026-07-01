import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStore, setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

const USER_KEY = 'cropadmin_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  const logout = useCallback(async (silent = false) => {
    if (!silent) {
      try {
        await authApi.logout();
      } catch (_) {
        /* ignore network errors on logout */
      }
    }
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Wire the axios 401 handler to force-logout.
  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    setReady(true);
  }, [logout]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user: u } = res.data;
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const isAuthenticated = Boolean(user && tokenStore.get());

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

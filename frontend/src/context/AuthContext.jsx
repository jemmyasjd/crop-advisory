import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStore, setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/services';

const AuthContext = createContext(null);
const USER_KEY = 'cropfarmer_user';

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
        /* ignore */
      }
    }
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    setReady(true);
  }, [logout]);

  const persist = (token, u) => {
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signup = async (payload) => {
    const res = await authApi.signup(payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isAuthenticated = Boolean(user && tokenStore.get());

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, ready, signup, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

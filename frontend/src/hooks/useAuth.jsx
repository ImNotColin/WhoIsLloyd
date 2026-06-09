import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../services/api.js';
import { getStoredTokens, storeTokens } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'dbc_user';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    getStoredTokens() ? getStoredUser() : null
  );

  const persistUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login(email, password);
      storeTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    storeTokens(null);
    persistUser(null);
  }, [persistUser]);

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const data = await api.changePassword(currentPassword, newPassword);
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  // The api layer fires this when a token refresh fails
  useEffect(() => {
    const onForcedLogout = () => persistUser(null);
    window.addEventListener('dbc:logout', onForcedLogout);
    return () => window.removeEventListener('dbc:logout', onForcedLogout);
  }, [persistUser]);

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, setUser: persistUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

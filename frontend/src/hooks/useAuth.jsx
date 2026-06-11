// useAuth.jsx — who is flying this thing? One context holding the current
// user, plus login/logout/changePassword. The api layer owns the tokens;
// this file owns the human attached to them.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../services/api.js';
import { getStoredTokens, storeTokens } from '../services/api.js';

const AuthContext = createContext(null);

const USER_KEY = 'dbc_user';

// Cached user object from localStorage, or null if it's missing or someone's
// been creative with devtools.
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // A cached user without tokens is a ghost — don't resurrect it. Tokens are
  // the source of truth; the user object is just the in-flight manifest.
  const [user, setUser] = useState(() =>
    getStoredTokens() ? getStoredUser() : null
  );

  // setUser, but it also keeps localStorage honest.
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

  // The api layer fires 'dbc:logout' when a silent token refresh fails.
  // It can't import React state from inside an axios interceptor, so it
  // shouts across the window instead. We listen, and escort the user out.
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

// The hook everyone actually imports. Throws if used outside the provider,
// because a silent null here becomes a very loud bug three components later.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

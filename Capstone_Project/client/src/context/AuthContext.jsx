import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredTokens, setStoredTokens, clearStoredTokens } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored user session on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getStoredTokens();
      const savedUser = localStorage.getItem('shortlink_user');

      if (accessToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify with backend silently
          const res = await api.getProfile();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('shortlink_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setUser(res.user);
    setStoredTokens(res.accessToken, res.refreshToken);
    localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await api.register({ name, email, password, role });
    setUser(res.user);
    setStoredTokens(res.accessToken, res.refreshToken);
    localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      clearStoredTokens();
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredTokens, setStoredTokens, clearStoredTokens } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shortlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const { accessToken } = getStoredTokens();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getProfile();
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('shortlink_user', JSON.stringify(res.user));
        }
      } catch (err) {
        clearStoredTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.user && res.accessToken) {
      setUser(res.user);
      setStoredTokens(res.accessToken, res.refreshToken);
      localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginDemo = async (role = 'user') => {
    const res = await api.demoLogin(role);
    if (res.user && res.accessToken) {
      setUser(res.user);
      setStoredTokens(res.accessToken, res.refreshToken);
      localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginWithGoogle = async (payload = {}) => {
    const res = await api.googleLogin(payload);
    if (res.user && res.accessToken) {
      setUser(res.user);
      setStoredTokens(res.accessToken, res.refreshToken);
      localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (name, email, password, role) => {
    const res = await api.register({ name, email, password, role });
    if (res.user && res.accessToken) {
      setUser(res.user);
      setStoredTokens(res.accessToken, res.refreshToken);
      localStorage.setItem('shortlink_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        loginDemo,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

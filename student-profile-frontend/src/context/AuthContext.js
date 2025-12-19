import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const res = await axios.get(`${API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Merge with existing user so we keep id from auth if present.
    setUser((prev) => ({ ...(prev || {}), ...(res.data || {}) }));
    return res.data;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsAuthenticated(true);

    // Best-effort: if it fails, user can still stay authenticated client-side.
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);

    // Pull profile picture + latest profile fields.
    try {
      await refreshProfile();
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

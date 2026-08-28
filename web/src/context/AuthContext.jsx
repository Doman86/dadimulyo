import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Listen for 401 events from the API client interceptor
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshUser() {
    try {
      const { data } = await client.get('/user');
      setUser(data.data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
    } catch {
      // 401 interceptor already clears storage.
      setUser(null);
    }
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await client.post('/login', { email, password });
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login gagal.' };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await client.post('/register', payload);
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { success: true };
    } catch (error) {
      const firstError = error.response?.data?.errors;
      const message = firstError
        ? Object.values(firstError)[0]?.[0]
        : error.response?.data?.message || 'Registrasi gagal.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await client.post('/logout');
    } catch {
      // Ignore network errors on logout; always clear locally.
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

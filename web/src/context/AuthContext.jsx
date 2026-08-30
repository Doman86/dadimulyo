import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

/**
 * Parse JSON dari localStorage dengan aman.
 * Jika data corrupt, return null (bukan crash).
 */
function safeParseUser(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Pastikan minimal punya id atau email agar data valid
    if (parsed && typeof parsed === 'object' && (parsed.id || parsed.email)) {
      return parsed;
    }
    return null;
  } catch {
    // Data corrupt — hapus supaya tidak terulang
    localStorage.removeItem('auth_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeParseUser(localStorage.getItem('auth_user')));
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
      // Defensif: pastikan response structure benar
      const freshUser = data?.data?.user;
      if (freshUser && (freshUser.id || freshUser.email)) {
        setUser(freshUser);
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
      } else {
        // Response tidak valid — mungkin token expired
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } catch (err) {
      // Only clear the session on an actual auth failure (401). Network/CORS
      // errors mean the backend is unreachable right now — do NOT log the user
      // out, otherwise a temporary outage shows as "redirected to login".
      if (err.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      // Untuk error lain (500, network), biarkan user tetap login
      // dengan data dari localStorage. Akan retry di refresh berikutnya.
    }
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await client.post('/login', { email, password });

      // Defensif: pastikan response structure benar
      const token = data?.data?.token;
      const freshUser = data?.data?.user;

      if (!token || !freshUser) {
        return {
          success: false,
          message: data?.message || 'Response server tidak valid.',
        };
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(freshUser));
      setUser(freshUser);
      return { success: true };
    } catch (error) {
      // Tangkap semua jenis error dengan pesan yang informatif
      const serverMsg = error.response?.data?.message;
      const status = error.response?.status;

      if (status === 422) {
        // Validation error — ambil pesan pertama
        const errors = error.response?.data?.errors;
        const firstMsg = errors ? Object.values(errors)[0]?.[0] : null;
        return { success: false, message: firstMsg || 'Data tidak valid.' };
      }
      if (status === 401) {
        return { success: false, message: serverMsg || 'Email atau password salah.' };
      }
      if (status === 403) {
        return { success: false, message: serverMsg || 'Akun Anda tidak aktif.' };
      }
      if (status === 429) {
        return { success: false, message: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.' };
      }
      if (status === 500) {
        return { success: false, message: 'Server sedang bermasalah. Silakan coba lagi.' };
      }
      if (!error.response) {
        // Network error
        return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' };
      }
      return { success: false, message: serverMsg || 'Login gagal.' };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await client.post('/register', payload);

      // Defensif: pastikan response structure benar
      const token = data?.data?.token;
      const freshUser = data?.data?.user;

      if (!token || !freshUser) {
        return {
          success: false,
          message: data?.message || 'Response server tidak valid.',
        };
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(freshUser));
      setUser(freshUser);
      return { success: true };
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      const status = error.response?.status;

      if (status === 422) {
        const errors = error.response?.data?.errors;
        const firstMsg = errors ? Object.values(errors)[0]?.[0] : null;
        return { success: false, message: firstMsg || 'Data tidak valid.' };
      }
      if (status === 429) {
        return { success: false, message: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.' };
      }
      if (status === 500) {
        return { success: false, message: 'Server sedang bermasalah. Silakan coba lagi.' };
      }
      if (!error.response) {
        return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' };
      }
      return { success: false, message: serverMsg || 'Registrasi gagal.' };
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

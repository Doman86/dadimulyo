import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();
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

      // Login kini wajib verifikasi OTP yang dikirim ke email asli user.
      if (data?.data?.needs_otp === true) {
        return {
          success: true,
          needsOtp: true,
          email: data?.data?.email || email,
          emailMasked: data?.data?.email_masked || '',
          message: data?.message || t('auth.otp_sent'),
        };
      }

      // Defensif: pastikan response structure benar
      const token = data?.data?.token;
      const freshUser = data?.data?.user;

      if (!token || !freshUser) {
        return {
          success: false,
          message: data?.message || t('auth.invalid_server_response'),
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
        return { success: false, message: firstMsg || t('auth.invalid_data') };
      }
      if (status === 401) {
        return { success: false, message: serverMsg || t('auth.invalid_credentials') };
      }
      if (status === 403) {
        return { success: false, message: serverMsg || t('auth.account_inactive') };
      }
      if (status === 429) {
        return { success: false, message: t('auth.too_many_attempts') };
      }
      if (status === 500) {
        return { success: false, message: t('auth.server_error') };
      }
      if (!error.response) {
        // Network error
        return { success: false, message: t('auth.network_error') };
      }
      return { success: false, message: serverMsg || t('auth.login_failed') };
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(email, code) {
    setLoading(true);
    try {
      const { data } = await client.post('/login/verify', { email, code });

      const token = data?.data?.token;
      const freshUser = data?.data?.user;

      if (!token || !freshUser) {
        return {
          success: false,
          message: data?.message || t('auth.invalid_server_response'),
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
        return { success: false, message: firstMsg || serverMsg || t('auth.wrong_otp') };
      }
      if (status === 429) {
        return { success: false, message: serverMsg || t('auth.request_new_code') };
      }
      if (status === 500) {
        return { success: false, message: serverMsg || 'Server sedang bermasalah. Silakan coba lagi.' };
      }
      if (!error.response) {
        return { success: false, message: t('auth.network_error') };
      }
      return { success: false, message: serverMsg || t('auth.verify_failed') };
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp(email) {
    try {
      const { data } = await client.post('/login/resend', { email });
      return {
        success: data?.success === true,
        emailMasked: data?.data?.email_masked || '',
        message: data?.message || t('auth.otp_resent'),
      };
    } catch (error) {
      const serverMsg = error.response?.data?.message;
      const status = error.response?.status;
      if (status === 429) {
        return { success: false, message: serverMsg || t('auth.too_many_requests') };
      }
      if (status === 404) {
        return { success: false, message: serverMsg || t('auth.email_not_found') };
      }
      if (!error.response) {
        return { success: false, message: t('auth.network_error') };
      }
      return { success: false, message: serverMsg || t('auth.resend_failed') };
    }
  }

  async function register(payload) {
    setLoading(true);
    try {
      const { data } = await client.post('/register', payload);

      // Registrasi wajib verifikasi OTP yang dikirim ke email asli user.
      if (data?.data?.needs_otp === true) {
        return {
          success: true,
          needsOtp: true,
          email: data?.data?.email || payload.email,
          emailMasked: data?.data?.email_masked || '',
          message: data?.message || t('auth.otp_sent'),
        };
      }

      // Defensif: pastikan response structure benar
      const token = data?.data?.token;
      const freshUser = data?.data?.user;

      if (!token || !freshUser) {
        return {
          success: false,
          message: data?.message || t('auth.invalid_server_response'),
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
        return { success: false, message: firstMsg || t('auth.invalid_data') };
      }
      if (status === 429) {
        return { success: false, message: t('auth.too_many_attempts') };
      }
      if (status === 500) {
        return { success: false, message: t('auth.server_error') };
      }
      if (!error.response) {
        return { success: false, message: t('auth.network_error') };
      }
      return { success: false, message: serverMsg || t('auth.register_failed') };
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
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, resendOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

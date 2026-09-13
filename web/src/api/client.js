
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://dadimulyo.my.id/api';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout')
    ) {
      error.response = error.response || {};
      error.response.data = {
        success: false,
        message: 'Koneksi timeout. Silakan coba lagi.',
      };
      error.response.status = 408;
    }

    if (!error.response && error.request) {
      error.response = {
        data: {
          success: false,
          message: 'Tidak dapat terhubung ke server.',
        },
        status: 0,
      };
    }

    return Promise.reject(error);
  }
);

export default client;


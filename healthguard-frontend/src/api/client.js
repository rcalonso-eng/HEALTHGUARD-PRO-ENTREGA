// src/api/client.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor: añade el access token ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: refresca si 401 ---
let refreshingPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si no es 401, o ya intentamos refrescar, o es el propio refresh => falla
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      logoutLocal();
      return Promise.reject(error);
    }

    try {
      // Evita refrescos concurrentes
      if (!refreshingPromise) {
        refreshingPromise = axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );
      }
      const { data } = await refreshingPromise;
      refreshingPromise = null;

      localStorage.setItem('access_token', data.access_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original); // reintenta la petición original
    } catch (refreshErr) {
      refreshingPromise = null;
      logoutLocal();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    }
  }
);

function logoutLocal() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('usuario');
}

export { logoutLocal };
export default api;
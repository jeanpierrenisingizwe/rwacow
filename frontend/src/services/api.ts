import axios from 'axios';
import { mockRequest } from '../demo/demoMode';

// Set to true to force demo mode even if backend is up
// Set to false to always try the real backend first
const FORCE_DEMO = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  // Hosted backends (Railway/Render free tier) can be slow to wake up,
  // so allow more time before falling back to demo mode.
  timeout: 15000,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'demo-token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on network error or timeout → fall back to demo data
api.interceptors.response.use(
  (response) => {
    // If we get a real response, clear demo mode
    if (localStorage.getItem('demo_mode') === 'true') {
      localStorage.removeItem('demo_mode');
    }
    return response;
  },
  (error) => {
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error';

    if (isNetworkError || FORCE_DEMO) {
      // Extract method, url, body from the failed request
      const method = error.config?.method || 'get';
      const fullUrl = error.config?.url || '';
      // Strip baseURL prefix to get just the path
      const baseURL = error.config?.baseURL || 'http://localhost:5000/api';
      const url = fullUrl.startsWith(baseURL)
        ? fullUrl.slice(baseURL.length).replace(/^\//, '')
        : fullUrl.replace(/^\//, '');

      let body: unknown;
      try { body = JSON.parse(error.config?.data || '{}'); } catch { body = {}; }

      try {
        const mockResult = mockRequest(method, url, body);
        if (mockResult !== null) {
          console.info(`[Demo Mode] ${method.toUpperCase()} /${url}`);
          // Mark that we're in demo mode
          localStorage.setItem('demo_mode', 'true');
          return Promise.resolve(mockResult);
        }
      } catch (mockError) {
        // Mock threw a structured error (e.g. 401) — pass it through
        return Promise.reject(mockError);
      }
    }

    // Real API 401 → clear token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export const isDemoMode = () => localStorage.getItem('demo_mode') === 'true';

export default api;

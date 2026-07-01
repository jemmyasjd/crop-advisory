import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'cropfarmer_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message =
      data?.message ||
      (data?.details && data.details[0]?.message) ||
      error.message ||
      'Something went wrong';

    if (status === 401 && onUnauthorized && tokenStore.get()) {
      toast.error('Session expired. Please log in again.');
      onUnauthorized();
    }
    return Promise.reject({ status, message, details: data?.details });
  }
);

export default api;

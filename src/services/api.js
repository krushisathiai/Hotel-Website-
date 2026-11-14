import axios from 'axios';

// Base API URL pointing to the Render backend (or configured via VITE_API_URL)
const baseURL = import.meta.env.VITE_API_URL || 'https://hotelapi-ykyb.onrender.com/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT Authorization header
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('dineflow_token') || localStorage.getItem('dineflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for storing tokens and handling 401 auth expiration
api.interceptors.response.use(
  (response) => {
    if (response.data?.data?.token) {
      sessionStorage.setItem('dineflow_token', response.data.data.token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('dineflow_token');
      localStorage.removeItem('dineflow_token');
    }
    return Promise.reject(error);
  }
);

export default api;

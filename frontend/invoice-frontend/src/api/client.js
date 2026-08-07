import axios from 'axios';

const apiClient = axios.create({
  baseURL: "http://169.58.137.92:8000/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Single-resource endpoints (clients, articles, devis, facture) return
// { data: {...} }. unwrap() pulls that out. Falls back to the raw body
// for the handful of endpoints (dashboard, article stats,
// company-settings) that return a plain object with no wrapper.
export function unwrap(response) {
  return response.data?.data ?? response.data;
}

// Paginated list endpoints return { data: [...], meta: {...}, links: {...} }.
export function unwrapPage(response) {
  return {
    items: response.data.data,
    meta: response.data.meta,
    links: response.data.links,
  };
}

export default apiClient;
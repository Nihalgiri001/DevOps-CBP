import axios from 'axios';

/**
 * Centralised Axios client for all backend API communication.
 * Requirements: 5.3
 *
 * - Base URL sourced from REACT_APP_API_URL environment variable.
 * - Request interceptor attaches the JWT token from localStorage.
 * - Response interceptor handles 401 responses by clearing the token
 *   and redirecting to /login.
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Attach the stored auth token to every outgoing request when present.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
// On 401 (Unauthorized): clear the stored token and redirect to /login.
// For all other errors: normalise and re-throw the error object.
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    const normalizedError = {
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An unexpected error occurred',
      statusCode: error.response?.status,
      details: error.response?.data?.details,
    };

    throw normalizedError;
  }
);

// ── API service methods ───────────────────────────────────────────────────────

const apiService = {
  // Announcements
  getAnnouncements: () => apiClient.get('/announcements'),
  getAnnouncement: (id) => apiClient.get(`/announcements/${id}`),
  createAnnouncement: (data) => apiClient.post('/announcements', data),
  updateAnnouncement: (id, data) => apiClient.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => apiClient.delete(`/announcements/${id}`),

  // Events
  getEvents: () => apiClient.get('/events'),
  getEvent: (id) => apiClient.get(`/events/${id}`),
  createEvent: (data) => apiClient.post('/events', data),
  updateEvent: (id, data) => apiClient.put(`/events/${id}`, data),
  deleteEvent: (id) => apiClient.delete(`/events/${id}`),

  // Health
  getHealth: () => apiClient.get('/health'),
};

export { apiClient };
export default apiService;

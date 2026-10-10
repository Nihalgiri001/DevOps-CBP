import { apiClient } from './apiService';

/**
 * authService handles all authentication API calls and token/user persistence.
 * Requirements: 1.12, 14.8, 14.9
 *
 * localStorage keys:
 *   'authToken' – JWT string
 *   'authUser'  – JSON-serialised user object
 */

const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'authUser',
};

const authService = {
  /**
   * Register a new user account.
   * @param {{ username: string, email: string, password: string }} data
   * @returns {Promise<{ userId, username, email, role }>}
   */
  async register(data) {
    // apiClient's response interceptor returns response.data (the full body).
    // The backend wraps the payload in a `data` property:
    // { success, data: { userId, username, email, role }, message }
    const response = await apiClient.post('/auth/register', data);
    return response.data; // { userId, username, email, role }
  },

  /**
   * Authenticate with email and password.
   * Stores the JWT token and user object in localStorage on success.
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(data) {
    // apiClient's response interceptor returns response.data (the full body).
    // The backend wraps the payload in a `data` property:
    // { success, data: { token, user }, message }
    const response = await apiClient.post('/auth/login', data);
    const { token, user } = response.data;

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { token, user };
  },

  /**
   * Clear all authentication state from localStorage.
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Return the currently stored user object, or null if not authenticated.
   * @returns {object|null}
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check whether a valid auth token exists in localStorage.
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * Check whether the current user has the Administrator role.
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'Administrator';
  },
};

export default authService;

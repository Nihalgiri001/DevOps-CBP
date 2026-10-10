import React, { createContext, useContext, useState } from 'react';
import authService from '../services/authService';

/**
 * AuthContext provides authentication state and actions to the component tree.
 * Requirements: 14.8, 14.9
 */
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the application and manages auth state.
 * State is initialised from localStorage so it persists across page refreshes.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  /**
   * login calls the auth service, which stores the token/user in localStorage,
   * then updates the in-memory context state.
   */
  const login = async (email, password) => {
    const { token, user: loggedInUser } = await authService.login({ email, password });
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return { token, user: loggedInUser };
  };

  /**
   * logout clears localStorage through the auth service and resets context state.
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth is a convenience hook for consuming the AuthContext.
 * Throws if used outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

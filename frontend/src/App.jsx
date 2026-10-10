import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

/**
 * Lazy-loaded page components.
 * Using React.lazy keeps the initial bundle small and matches the expected
 * pages/ structure documented in the design.
 */
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AnnouncementsPage = React.lazy(() => import('./pages/AnnouncementsPage'));
const EventsPage = React.lazy(() => import('./pages/EventsPage'));

/**
 * App defines the full route structure for the CommunityLink frontend.
 *
 * Public routes  : /register, /login
 * Protected routes: / (→ dashboard), /dashboard, /announcements, /events
 *
 * AuthProvider is placed here so the entire route tree has access to
 * authentication context.
 *
 * Requirements: 14.2, 14.7
 */
function App() {
  return (
    <AuthProvider>
      <React.Suspense fallback={<div>Loading…</div>}>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback: redirect unknown paths to dashboard (protected) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </AuthProvider>
  );
}

export default App;

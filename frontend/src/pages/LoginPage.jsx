import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage renders a login form and handles the full sign-in flow.
 *
 * - Client-side validation: required fields, email format
 * - Calls useAuth().login() on submit (which calls authService.login())
 * - Stores token in localStorage (handled by AuthContext / authService)
 * - Redirects to /dashboard on success
 * - Displays API errors inline
 *
 * Requirements: 1.11, 1.12, 14.5, 14.6
 */
function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Client-side validation ────────────────────────────────────────────────

  function validate(data) {
    const errs = {};

    if (!data.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!data.password) {
      errs.password = 'Password is required.';
    }

    return errs;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-level error when the user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>Welcome back to CommunityLink</p>

        {apiError && (
          <div style={styles.apiError} role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              disabled={loading}
            />
            {errors.email && (
              <span id="email-error" style={styles.fieldError} role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {}),
              }}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              disabled={loading}
            />
            {errors.password && (
              <span id="password-error" style={styles.fieldError} role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    margin: '0 0 0.25rem',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a202c',
  },
  subtitle: {
    margin: '0 0 1.5rem',
    color: '#718096',
    fontSize: '0.95rem',
  },
  apiError: {
    backgroundColor: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '4px',
    color: '#c53030',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  field: {
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.35rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#2d3748',
  },
  input: {
    padding: '0.55rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#fc8181',
  },
  fieldError: {
    marginTop: '0.3rem',
    color: '#e53e3e',
    fontSize: '0.8rem',
  },
  button: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#3182ce',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#90cdf4',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#718096',
  },
  link: {
    color: '#3182ce',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default LoginPage;

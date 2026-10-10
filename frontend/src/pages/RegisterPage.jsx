import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

/**
 * RegisterPage renders a registration form and handles the full registration flow.
 *
 * - Client-side validation: required fields, email format, password min 6 chars
 * - Calls authService.register() on submit
 * - Redirects to /login on success
 * - Displays API errors inline
 *
 * Requirements: 1.10, 14.5, 14.6
 */
function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Client-side validation ────────────────────────────────────────────────

  function validate(data) {
    const errs = {};

    if (!data.username.trim()) {
      errs.username = 'Username is required.';
    } else if (data.username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    }

    if (!data.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!data.password) {
      errs.password = 'Password is required.';
    } else if (data.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
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
      await authService.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/login');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join your community on CommunityLink</p>

        {apiError && (
          <div style={styles.apiError} role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.username ? styles.inputError : {}),
              }}
              aria-describedby={errors.username ? 'username-error' : undefined}
              aria-invalid={!!errors.username}
              disabled={loading}
            />
            {errors.username && (
              <span id="username-error" style={styles.fieldError} role="alert">
                {errors.username}
              </span>
            )}
          </div>

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
              autoComplete="new-password"
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
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
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

export default RegisterPage;

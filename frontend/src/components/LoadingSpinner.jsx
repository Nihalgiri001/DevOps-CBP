import React from 'react';

/**
 * LoadingSpinner displays a simple loading indicator during async operations.
 * Requirements: 4.7, 14.3
 */
function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={styles.container} role="status" aria-live="polite">
      <div style={styles.spinner} aria-hidden="true" />
      <p style={styles.text}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: '#718096',
  },
  spinner: {
    width: '2.5rem',
    height: '2.5rem',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3182ce',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    marginTop: '1rem',
    fontSize: '0.95rem',
    color: '#718096',
  },
};

// Inject the keyframe animation once
if (typeof document !== 'undefined' && !document.getElementById('loading-spinner-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'loading-spinner-styles';
  styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(styleEl);
}

export default LoadingSpinner;

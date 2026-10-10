import React from 'react';

/**
 * ErrorMessage renders an error banner with an optional dismiss button.
 * Requirements: 4.6, 14.4
 *
 * Props:
 *   message  {string}   - The error text to display.
 *   onDismiss {function} - Optional callback to dismiss the banner.
 */
function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div style={styles.banner} role="alert" aria-live="assertive">
      <span style={styles.text}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={styles.dismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '4px',
    color: '#c53030',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    gap: '0.75rem',
  },
  text: {
    flex: 1,
  },
  dismiss: {
    background: 'none',
    border: 'none',
    color: '#c53030',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    padding: '0',
    flexShrink: 0,
  },
};

export default ErrorMessage;

import React, { useState, useEffect } from 'react';

/**
 * AnnouncementForm handles both creating and editing announcements.
 *
 * Props:
 *   initialData {object|null} - Pre-populated data when editing; null for create mode.
 *   onSubmit    {function}    - Called with { title, content, author } on valid submission.
 *   onCancel    {function}    - Called when the user cancels the form.
 *
 * Requirements: 2.14, 2.15, 14.5, 14.6
 */
function AnnouncementForm({ initialData = null, onSubmit, onCancel }) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Populate fields when editing an existing announcement
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        author: initialData.author || '',
      });
    }
  }, [initialData]);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(data) {
    const errs = {};

    if (!data.title.trim()) {
      errs.title = 'Title is required.';
    } else if (data.title.trim().length > 200) {
      errs.title = 'Title must be 200 characters or fewer.';
    }

    if (!data.content.trim()) {
      errs.content = 'Content is required.';
    } else if (data.content.trim().length > 5000) {
      errs.content = 'Content must be 5000 characters or fewer.';
    }

    if (!data.author.trim()) {
      errs.author = 'Author is required.';
    }

    return errs;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content.trim(),
        author: formData.author.trim(),
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to save announcement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>
        {isEditMode ? 'Edit Announcement' : 'New Announcement'}
      </h2>

      {submitError && (
        <div style={styles.submitError} role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div style={styles.field}>
          <label htmlFor="ann-title" style={styles.label}>
            Title
          </label>
          <input
            id="ann-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            maxLength={200}
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            aria-describedby={errors.title ? 'ann-title-error' : undefined}
            aria-invalid={!!errors.title}
            disabled={submitting}
          />
          {errors.title && (
            <span id="ann-title-error" style={styles.fieldError} role="alert">
              {errors.title}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={styles.field}>
          <label htmlFor="ann-content" style={styles.label}>
            Content
          </label>
          <textarea
            id="ann-content"
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleChange}
            maxLength={5000}
            style={{
              ...styles.input,
              ...styles.textarea,
              ...(errors.content ? styles.inputError : {}),
            }}
            aria-describedby={errors.content ? 'ann-content-error' : undefined}
            aria-invalid={!!errors.content}
            disabled={submitting}
          />
          {errors.content && (
            <span id="ann-content-error" style={styles.fieldError} role="alert">
              {errors.content}
            </span>
          )}
        </div>

        {/* Author */}
        <div style={styles.field}>
          <label htmlFor="ann-author" style={styles.label}>
            Author
          </label>
          <input
            id="ann-author"
            name="author"
            type="text"
            value={formData.author}
            onChange={handleChange}
            style={{ ...styles.input, ...(errors.author ? styles.inputError : {}) }}
            aria-describedby={errors.author ? 'ann-author-error' : undefined}
            aria-invalid={!!errors.author}
            disabled={submitting}
          />
          {errors.author && (
            <span id="ann-author-error" style={styles.fieldError} role="alert">
              {errors.author}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(submitting ? styles.buttonDisabled : {}),
            }}
            disabled={submitting}
          >
            {submitting
              ? isEditMode
                ? 'Saving…'
                : 'Creating…'
              : isEditMode
              ? 'Save Changes'
              : 'Create Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    padding: '1.5rem 2rem',
    marginBottom: '1.5rem',
  },
  heading: {
    margin: '0 0 1.25rem',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1a202c',
  },
  submitError: {
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
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  inputError: {
    borderColor: '#fc8181',
  },
  fieldError: {
    marginTop: '0.3rem',
    color: '#e53e3e',
    fontSize: '0.8rem',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelButton: {
    padding: '0.6rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#4a5568',
    backgroundColor: '#edf2f7',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '0.6rem 1.25rem',
    fontSize: '0.95rem',
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
};

export default AnnouncementForm;

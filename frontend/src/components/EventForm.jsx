import React, { useState, useEffect } from 'react';

/**
 * EventForm handles both creating and editing community events.
 *
 * Props:
 *   initialData {object|null} - Pre-populated data when editing; null for create mode.
 *   onSubmit    {function}    - Called with { title, description, date, time, location }
 *                               on valid submission.
 *   onCancel    {function}    - Called when the user cancels the form.
 *
 * Requirements: 3.14, 3.15, 14.5, 14.6
 */
function EventForm({ initialData = null, onSubmit, onCancel }) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Populate fields when editing an existing event
  useEffect(() => {
    if (initialData) {
      // Normalise date: keep only the YYYY-MM-DD part for the <input type="date"> value
      const rawDate = initialData.date || '';
      const normalisedDate = rawDate.length > 10 ? rawDate.slice(0, 10) : rawDate;

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: normalisedDate,
        time: initialData.time || '',
        location: initialData.location || '',
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

    if (!data.description.trim()) {
      errs.description = 'Description is required.';
    } else if (data.description.trim().length > 5000) {
      errs.description = 'Description must be 5000 characters or fewer.';
    }

    if (!data.date.trim()) {
      errs.date = 'Date is required.';
    } else {
      // Validate YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date.trim())) {
        errs.date = 'Date must be in YYYY-MM-DD format.';
      } else {
        const parsed = new Date(`${data.date.trim()}T00:00:00`);
        if (isNaN(parsed.getTime())) {
          errs.date = 'Please enter a valid date.';
        }
      }
    }

    if (!data.time.trim()) {
      errs.time = 'Time is required.';
    } else {
      // Validate HH:MM (24-hour) format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.time.trim())) {
        errs.time = 'Time must be in HH:MM format (24-hour), e.g. 18:30.';
      }
    }

    if (!data.location.trim()) {
      errs.location = 'Location is required.';
    } else if (data.location.trim().length > 300) {
      errs.location = 'Location must be 300 characters or fewer.';
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
        description: formData.description.trim(),
        date: formData.date.trim(),
        time: formData.time.trim(),
        location: formData.location.trim(),
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to save event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>
        {isEditMode ? 'Edit Event' : 'New Event'}
      </h2>

      {submitError && (
        <div style={styles.submitError} role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div style={styles.field}>
          <label htmlFor="event-title" style={styles.label}>
            Title
          </label>
          <input
            id="event-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            maxLength={200}
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            aria-describedby={errors.title ? 'event-title-error' : undefined}
            aria-invalid={!!errors.title}
            disabled={submitting}
          />
          {errors.title && (
            <span id="event-title-error" style={styles.fieldError} role="alert">
              {errors.title}
            </span>
          )}
        </div>

        {/* Description */}
        <div style={styles.field}>
          <label htmlFor="event-description" style={styles.label}>
            Description
          </label>
          <textarea
            id="event-description"
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            maxLength={5000}
            style={{
              ...styles.input,
              ...styles.textarea,
              ...(errors.description ? styles.inputError : {}),
            }}
            aria-describedby={errors.description ? 'event-description-error' : undefined}
            aria-invalid={!!errors.description}
            disabled={submitting}
          />
          {errors.description && (
            <span id="event-description-error" style={styles.fieldError} role="alert">
              {errors.description}
            </span>
          )}
        </div>

        {/* Date and Time — side by side on wider screens */}
        <div style={styles.row}>
          {/* Date */}
          <div style={{ ...styles.field, flex: 1 }}>
            <label htmlFor="event-date" style={styles.label}>
              Date
            </label>
            <input
              id="event-date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              style={{ ...styles.input, ...(errors.date ? styles.inputError : {}) }}
              aria-describedby={errors.date ? 'event-date-error' : undefined}
              aria-invalid={!!errors.date}
              disabled={submitting}
            />
            {errors.date && (
              <span id="event-date-error" style={styles.fieldError} role="alert">
                {errors.date}
              </span>
            )}
          </div>

          {/* Time */}
          <div style={{ ...styles.field, flex: 1 }}>
            <label htmlFor="event-time" style={styles.label}>
              Time <span style={styles.hint}>(HH:MM, 24-hour)</span>
            </label>
            <input
              id="event-time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              style={{ ...styles.input, ...(errors.time ? styles.inputError : {}) }}
              aria-describedby={errors.time ? 'event-time-error' : undefined}
              aria-invalid={!!errors.time}
              disabled={submitting}
            />
            {errors.time && (
              <span id="event-time-error" style={styles.fieldError} role="alert">
                {errors.time}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div style={styles.field}>
          <label htmlFor="event-location" style={styles.label}>
            Location
          </label>
          <input
            id="event-location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            maxLength={300}
            style={{ ...styles.input, ...(errors.location ? styles.inputError : {}) }}
            aria-describedby={errors.location ? 'event-location-error' : undefined}
            aria-invalid={!!errors.location}
            disabled={submitting}
          />
          {errors.location && (
            <span id="event-location-error" style={styles.fieldError} role="alert">
              {errors.location}
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
              : 'Create Event'}
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
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  label: {
    marginBottom: '0.35rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#2d3748',
  },
  hint: {
    fontWeight: 400,
    fontSize: '0.8rem',
    color: '#718096',
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

export default EventForm;

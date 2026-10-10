import React from 'react';

/**
 * EventCard displays a single community event.
 * Edit and Delete buttons are shown only for admin users.
 *
 * Props:
 *   event    {object}   - The event data (_id, title, description, date, time, location, createdAt)
 *   onEdit   {function} - Callback invoked with the event object when Edit is clicked
 *   onDelete {function} - Callback invoked with event._id when Delete is clicked
 *   isAdmin  {boolean}  - Whether to show admin controls
 *
 * Requirements: 3.13, 15.7
 */
function EventCard({ event, onEdit, onDelete, isAdmin }) {
  const { _id, title, description, date, time, location, createdAt } = event;

  /**
   * Format the event date (stored as ISO date string YYYY-MM-DD or full ISO 8601)
   * into a readable locale string, e.g. "July 15, 2025".
   */
  const formattedDate = date
    ? (() => {
        // Append T00:00:00 to avoid timezone shift when parsing a bare date string
        const d = new Date(date.length === 10 ? `${date}T00:00:00` : date);
        return isNaN(d.getTime())
          ? date
          : d.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
      })()
    : '';

  /**
   * Format 24-hour HH:MM time to 12-hour locale string, e.g. "6:00 PM".
   */
  const formattedTime = time
    ? (() => {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return time;
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        });
      })()
    : '';

  return (
    <article style={styles.card} aria-labelledby={`event-title-${_id}`}>
      {/* Header: title + admin actions */}
      <div style={styles.header}>
        <h3 id={`event-title-${_id}`} style={styles.title}>
          {title}
        </h3>
        {isAdmin && (
          <div style={styles.actions}>
            <button
              onClick={() => onEdit(event)}
              style={styles.editButton}
              aria-label={`Edit event: ${title}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(_id)}
              style={styles.deleteButton}
              aria-label={`Delete event: ${title}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <p style={styles.description}>{description}</p>

      {/* Event metadata: date, time, location */}
      <div style={styles.metaGrid}>
        {formattedDate && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon} aria-hidden="true">📅</span>
            <time dateTime={date} style={styles.metaText}>
              {formattedDate}
            </time>
          </div>
        )}
        {formattedTime && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon} aria-hidden="true">🕐</span>
            <span style={styles.metaText}>{formattedTime}</span>
          </div>
        )}
        {location && (
          <div style={styles.metaItem}>
            <span style={styles.metaIcon} aria-hidden="true">📍</span>
            <span style={styles.metaText}>{location}</span>
          </div>
        )}
      </div>
    </article>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    padding: '1.25rem 1.5rem',
    marginBottom: '1rem',
    border: '1px solid #e2e8f0',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a202c',
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
  editButton: {
    padding: '0.3rem 0.75rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#3182ce',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '0.3rem 0.75rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#e53e3e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  description: {
    margin: '0 0 1rem',
    color: '#4a5568',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  metaGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 1.5rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  metaIcon: {
    fontSize: '0.9rem',
  },
  metaText: {
    fontSize: '0.85rem',
    color: '#718096',
  },
};

export default EventCard;

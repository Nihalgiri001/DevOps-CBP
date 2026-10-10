import React from 'react';

/**
 * AnnouncementCard displays a single announcement.
 * Edit and Delete buttons are shown only for admin users.
 *
 * Props:
 *   announcement {object}   - The announcement data (_id, title, content, author, createdAt)
 *   onEdit       {function} - Callback invoked with the announcement when Edit is clicked
 *   onDelete     {function} - Callback invoked with the announcement._id when Delete is clicked
 *   isAdmin      {boolean}  - Whether to show admin controls
 *
 * Requirements: 2.13, 2.15, 2.16, 14.10, 15.7, 15.8
 */
function AnnouncementCard({ announcement, onEdit, onDelete, isAdmin }) {
  const { _id, title, content, author, createdAt } = announcement;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article style={styles.card} aria-labelledby={`announcement-title-${_id}`}>
      <div style={styles.header}>
        <h3 id={`announcement-title-${_id}`} style={styles.title}>
          {title}
        </h3>
        {isAdmin && (
          <div style={styles.actions}>
            <button
              onClick={() => onEdit(announcement)}
              style={styles.editButton}
              aria-label={`Edit announcement: ${title}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(_id)}
              style={styles.deleteButton}
              aria-label={`Delete announcement: ${title}`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <p style={styles.content}>{content}</p>

      <footer style={styles.meta}>
        <span>By {author}</span>
        {formattedDate && (
          <>
            <span style={styles.metaSep}>&bull;</span>
            <time dateTime={createdAt}>{formattedDate}</time>
          </>
        )}
      </footer>
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
  content: {
    margin: '0 0 1rem',
    color: '#4a5568',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  meta: {
    fontSize: '0.82rem',
    color: '#718096',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  metaSep: {
    fontSize: '0.6rem',
  },
};

export default AnnouncementCard;

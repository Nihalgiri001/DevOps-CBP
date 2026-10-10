import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

/**
 * EventsPage lists all community events and provides
 * create / edit / delete controls for Administrator users.
 *
 * Data flow:
 *  - Fetches events on mount via apiService.getEvents()
 *  - The apiService response interceptor unwraps response.data, so the raw
 *    return value is the full success envelope { success, data, message }.
 *    The actual array lives in response.data.
 *
 * Requirements: 3.13, 3.14, 3.15, 3.16, 14.3, 14.4, 15.8
 */
function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form visibility & edit state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getEvents();
      // The interceptor unwraps response.data (the HTTP response body).
      // Backend returns { success: true, data: [...], message: '...' }
      // so the actual array lives in response.data.
      const list = response?.data ?? response ?? [];
      setEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleNewClick() {
    setEditingEvent(null);
    setShowForm(true);
  }

  function handleEditClick(event) {
    setEditingEvent(event);
    setShowForm(true);
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingEvent(null);
  }

  async function handleFormSubmit(data) {
    if (editingEvent) {
      await apiService.updateEvent(editingEvent._id, data);
    } else {
      await apiService.createEvent(data);
    }
    setShowForm(false);
    setEditingEvent(null);
    await fetchEvents();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );
    if (!confirmed) return;

    setError('');
    try {
      await apiService.deleteEvent(id);
      await fetchEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event.');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Events</h1>
            <p style={styles.pageSubtitle}>
              Upcoming community activities and gatherings.
            </p>
          </div>
          {isAdmin && !showForm && (
            <button onClick={handleNewClick} style={styles.newButton}>
              + New Event
            </button>
          )}
        </div>

        {/* Error banner */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Create / Edit form */}
        {showForm && (
          <EventForm
            initialData={editingEvent}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Content area */}
        {loading ? (
          <LoadingSpinner message="Loading events…" />
        ) : events.length === 0 ? (
          <div style={styles.empty}>
            <p>No events scheduled yet.</p>
            {isAdmin && (
              <p style={styles.emptyHint}>
                Click &ldquo;New Event&rdquo; above to add one.
              </p>
            )}
          </div>
        ) : (
          <div>
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isAdmin={isAdmin}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pageTitle: {
    margin: '0 0 0.25rem',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a202c',
  },
  pageSubtitle: {
    margin: 0,
    color: '#718096',
    fontSize: '0.95rem',
  },
  newButton: {
    padding: '0.6rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#3182ce',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '2.5rem',
    textAlign: 'center',
    color: '#718096',
  },
  emptyHint: {
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
};

export default EventsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementForm from '../components/AnnouncementForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

/**
 * AnnouncementsPage lists all community announcements and provides
 * create / edit / delete controls for Administrator users.
 *
 * Data flow:
 *  - Fetches announcements on mount via apiService.getAnnouncements()
 *  - apiService response interceptor unwraps response.data, so the raw
 *    return value is the full success envelope { success, data, message }.
 *    The actual array is in response.data.
 *
 * Requirements: 2.13, 2.14, 2.15, 2.16, 14.3, 14.4, 15.7, 15.8
 */
function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form visibility & edit state
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getAnnouncements();
      // The interceptor unwraps response.data (the HTTP response body).
      // Backend returns { success: true, data: [...], message: '...' }
      // so the actual array lives in response.data.
      const list = response?.data ?? response ?? [];
      setAnnouncements(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleNewClick() {
    setEditingAnnouncement(null);
    setShowForm(true);
  }

  function handleEditClick(announcement) {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingAnnouncement(null);
  }

  async function handleFormSubmit(data) {
    if (editingAnnouncement) {
      await apiService.updateAnnouncement(editingAnnouncement._id, data);
    } else {
      await apiService.createAnnouncement(data);
    }
    setShowForm(false);
    setEditingAnnouncement(null);
    await fetchAnnouncements();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this announcement? This action cannot be undone.'
    );
    if (!confirmed) return;

    setError('');
    try {
      await apiService.deleteAnnouncement(id);
      await fetchAnnouncements();
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Announcements</h1>
            <p style={styles.pageSubtitle}>
              Stay up to date with the latest community news.
            </p>
          </div>
          {isAdmin && !showForm && (
            <button onClick={handleNewClick} style={styles.newButton}>
              + New Announcement
            </button>
          )}
        </div>

        {/* Error banner */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Create / Edit form */}
        {showForm && (
          <AnnouncementForm
            initialData={editingAnnouncement}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {/* Content area */}
        {loading ? (
          <LoadingSpinner message="Loading announcements…" />
        ) : announcements.length === 0 ? (
          <div style={styles.empty}>
            <p>No announcements yet.</p>
            {isAdmin && (
              <p style={styles.emptyHint}>
                Click &ldquo;New Announcement&rdquo; above to post one.
              </p>
            )}
          </div>
        ) : (
          <div>
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
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

export default AnnouncementsPage;

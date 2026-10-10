import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import AnnouncementCard from '../components/AnnouncementCard';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

/**
 * DashboardPage shows a summary of recent announcements and upcoming events.
 * Displays the 3 most recent announcements and 3 upcoming events, with links
 * to the full lists.
 *
 * Requirements: 14.1, 14.2, 14.3
 */
function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [announcementsResponse, eventsResponse] = await Promise.all([
        apiService.getAnnouncements(),
        apiService.getEvents(),
      ]);

      // The apiService interceptor unwraps response.data (the HTTP body).
      // Backend returns { success, data: [...], message } so the array is in .data.
      const announcementList = announcementsResponse?.data ?? announcementsResponse ?? [];
      const eventList = eventsResponse?.data ?? eventsResponse ?? [];

      // 3 most recent announcements (already sorted descending by the API, take first 3)
      const recentAnnouncements = Array.isArray(announcementList)
        ? announcementList.slice(0, 3)
        : [];

      // 3 upcoming events: filter to future dates, then take the first 3
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const upcomingEvents = Array.isArray(eventList)
        ? eventList
            .filter((e) => {
              if (!e.date) return false;
              const d = new Date(e.date.length === 10 ? `${e.date}T00:00:00` : e.date);
              return !isNaN(d.getTime()) && d >= now;
            })
            .slice(0, 3)
        : [];

      setAnnouncements(recentAnnouncements);
      setEvents(upcomingEvents);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>
            Welcome{user?.username ? `, ${user.username}` : ''}!
          </h1>
          <p style={styles.pageSubtitle}>
            Here&rsquo;s what&rsquo;s happening in your community.
          </p>
        </div>

        {/* Error banner */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {loading ? (
          <LoadingSpinner message="Loading dashboard…" />
        ) : (
          <div style={styles.grid}>
            {/* ── Announcements section ── */}
            <section style={styles.section} aria-labelledby="announcements-heading">
              <div style={styles.sectionHeader}>
                <h2 id="announcements-heading" style={styles.sectionTitle}>
                  Recent Announcements
                </h2>
                <Link to="/announcements" style={styles.viewAllLink}>
                  View All →
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div style={styles.empty}>
                  <p>No announcements yet.</p>
                </div>
              ) : (
                <div>
                  {announcements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement._id}
                      announcement={announcement}
                      isAdmin={isAdmin}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ── Events section ── */}
            <section style={styles.section} aria-labelledby="events-heading">
              <div style={styles.sectionHeader}>
                <h2 id="events-heading" style={styles.sectionTitle}>
                  Upcoming Events
                </h2>
                <Link to="/events" style={styles.viewAllLink}>
                  View All →
                </Link>
              </div>

              {events.length === 0 ? (
                <div style={styles.empty}>
                  <p>No upcoming events scheduled.</p>
                </div>
              ) : (
                <div>
                  {events.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      isAdmin={isAdmin}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              )}
            </section>
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
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pageHeader: {
    marginBottom: '2rem',
  },
  pageTitle: {
    margin: '0 0 0.25rem',
    fontSize: '1.875rem',
    fontWeight: 700,
    color: '#1a202c',
  },
  pageSubtitle: {
    margin: 0,
    color: '#718096',
    fontSize: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    alignItems: 'start',
  },
  section: {
    minWidth: 0,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    gap: '0.5rem',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#2d3748',
  },
  viewAllLink: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#3182ce',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '2rem',
    textAlign: 'center',
    color: '#718096',
    fontSize: '0.9rem',
  },
};

export default DashboardPage;

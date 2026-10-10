import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar renders the application header with navigation links.
 *
 * - Unauthenticated: shows Login and Register links.
 * - Authenticated: shows Dashboard, Announcements, Events links.
 *   Admin users additionally see an Admin link (navigates to /announcements
 *   with admin controls — there is no separate /admin route in the current spec).
 * - Includes a Logout button that calls logout() from AuthContext.
 * - Responsive: collapses to a hamburger menu on small screens.
 *
 * Requirements: 14.2, 14.9, 15.7, 15.8
 */
function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Administrator';

  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  // Active link style helper for NavLink
  function navLinkStyle({ isActive }) {
    return {
      ...styles.navLink,
      ...(isActive ? styles.navLinkActive : {}),
    };
  }

  return (
    <nav style={styles.nav} aria-label="Main navigation">
      <div style={styles.inner}>
        {/* Logo / App name */}
        <NavLink to={isAuthenticated ? '/dashboard' : '/login'} style={styles.brand} onClick={closeMenu}>
          🌐 CommunityLink
        </NavLink>

        {/* Hamburger button (visible on small screens via inline media query workaround) */}
        <button
          id="navbar-hamburger"
          style={styles.hamburger}
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Nav links — 'open' class activates mobile display:flex via injected CSS */}
        <div
          id="nav-links"
          className={menuOpen ? 'open' : undefined}
          style={styles.linkGroup}
        >
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" style={navLinkStyle} onClick={closeMenu}>
                Dashboard
              </NavLink>
              <NavLink to="/announcements" style={navLinkStyle} onClick={closeMenu}>
                Announcements
              </NavLink>
              <NavLink to="/events" style={navLinkStyle} onClick={closeMenu}>
                Events
              </NavLink>
              {isAdmin && (
                <NavLink to="/announcements" style={navLinkStyle} onClick={closeMenu}>
                  Admin
                </NavLink>
              )}
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={navLinkStyle} onClick={closeMenu}>
                Login
              </NavLink>
              <NavLink to="/register" style={navLinkStyle} onClick={closeMenu}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Responsive styles injected once */}
      <NavbarStyles />
    </nav>
  );
}

/**
 * Injects responsive CSS for the Navbar once into <head>.
 * This avoids a dependency on an external CSS file.
 */
function NavbarStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('navbar-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'navbar-styles';
    styleEl.textContent = `
      /* Hide hamburger on desktop */
      @media (min-width: 640px) {
        #navbar-hamburger { display: none !important; }
        #nav-links { display: flex !important; align-items: center; gap: 0.25rem; }
      }
      /* Show hamburger on mobile; hide links by default */
      @media (max-width: 639px) {
        #navbar-hamburger { display: flex !important; }
        #nav-links {
          display: none;
          flex-direction: column;
          width: 100%;
          padding: 0.5rem 0 1rem;
          gap: 0.25rem;
        }
        #nav-links.open { display: flex !important; }
      }
    `;
    document.head.appendChild(styleEl);
  }
  return null;
}

const styles = {
  nav: {
    backgroundColor: '#1a202c',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    minHeight: '56px',
  },
  brand: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#ffffff',
    textDecoration: 'none',
    marginRight: 'auto',
    letterSpacing: '0.01em',
    padding: '0.5rem 0',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.4rem',
    cursor: 'pointer',
    padding: '0.4rem 0.5rem',
    lineHeight: 1,
    display: 'none', // controlled by CSS media query
  },
  linkGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  navLink: {
    color: '#cbd5e0',
    textDecoration: 'none',
    padding: '0.45rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.925rem',
    fontWeight: 500,
    transition: 'background-color 0.15s, color 0.15s',
  },
  navLinkActive: {
    color: '#ffffff',
    backgroundColor: '#2d3748',
  },
  logoutButton: {
    marginLeft: '0.5rem',
    padding: '0.4rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#e53e3e',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Navbar;

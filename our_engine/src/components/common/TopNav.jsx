/* ============================================================
   TOP NAV — Sticky top navigation bar
   ============================================================ */

import { useAuth } from '../../context/AuthContext';

export default function TopNav({ title, onMenuClick }) {
  return (
    <header className="topnav">
      <div className="topnav-left">
        {/* Mobile menu button */}
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        {title && <h2 className="topnav-title hide-mobile">{title}</h2>}
      </div>
      <div className="topnav-right">
        {/* Notification bell placeholder */}
        <button className="btn-icon btn-ghost" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  );
}

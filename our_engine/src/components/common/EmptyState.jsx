/* ============================================================
   EMPTY STATE — Empty list placeholder with icon & CTA
   ============================================================ */

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} props.icon - SVG icon name
 * @param {React.ReactNode} props.action - CTA button
 */
export default function EmptyState({ title, description, icon, action }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state__icon">
        {icon === 'orders' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        )}
        {icon === 'products' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        )}
        {icon === 'search' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        )}
        {icon === 'people' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        )}
        {!['orders', 'products', 'search', 'people'].includes(icon) && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
      </div>
      <h3 className="empty-state__title">{title || 'Nothing here yet'}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

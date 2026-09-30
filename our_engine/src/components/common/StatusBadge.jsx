/* ============================================================
   STATUS BADGE — Color-coded status pill
   ============================================================ */

import { getStatusBadgeConfig } from '../../utils/formatters';

/**
 * Status badge component.
 * @param {object} props
 * @param {'order'|'payment'|'delivery'} props.type
 * @param {string} props.status
 * @param {boolean} props.showDot
 */
export default function StatusBadge({ type, status, showDot = true }) {
  const config = getStatusBadgeConfig(type, status);

  return (
    <span className={`badge ${config.className}`}>
      {showDot && <span className="badge-dot" />}
      {config.label}
    </span>
  );
}

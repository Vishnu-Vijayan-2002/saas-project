/* ============================================================
   STAT CARD — Dashboard metric card
   ============================================================ */

import React from 'react';

/**
 * @param {object} props
 * @param {string} props.title - Metric title
 * @param {string} props.label - Alias for title
 * @param {string|number} props.value - Metric value to display
 * @param {string} props.subtitle - Optional subtitle text
 * @param {string} props.change - Optional change text (e.g. "+12%")
 * @param {'up'|'down'|'neutral'} props.trend
 * @param {string} props.color - CSS color for the accent bar
 * @param {'primary'|'success'|'warning'|'danger'|'info'} props.variant
 * @param {React.ReactNode} props.icon
 */
export default function StatCard({
  title,
  label,
  value,
  subtitle,
  change,
  trend = 'neutral',
  color,
  variant = 'primary',
  icon,
}) {
  const displayLabel = title || label || '';
  const displaySubtitle = subtitle || change || '';

  const variantColors = {
    primary: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-error)',
    info: 'var(--color-info)',
  };

  const accentColor = color || variantColors[variant] || 'var(--color-accent)';

  const trendColor =
    trend === 'up'
      ? 'var(--color-success)'
      : trend === 'down'
      ? 'var(--color-error)'
      : 'var(--color-text-tertiary)';

  return (
    <div
      className="stat-card animate-fade-in"
      style={{ '--stat-color': accentColor }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span className="stat-card__label">{displayLabel}</span>
        {icon && (
          <span
            style={{
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.85,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="stat-card__value">{value ?? 0}</div>

      {displaySubtitle && (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: change ? trendColor : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: 'auto',
          }}
        >
          {change && trend === 'up' && '↑ '}
          {change && trend === 'down' && '↓ '}
          {displaySubtitle}
        </div>
      )}
    </div>
  );
}

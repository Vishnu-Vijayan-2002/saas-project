/* ============================================================
   FORMATTERS — Display formatting utilities
   ============================================================ */

import { CURRENCY_SYMBOL, ORDER_STATES, PAYMENT_STATES, DELIVERY_STATES } from './constants.js';

/**
 * Format currency with Indian rupee symbol.
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a Firestore timestamp to a readable date string.
 * @param {object|Date|string} timestamp - Firestore Timestamp, Date, or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(timestamp, options = {}) {
  if (!timestamp) return '—';
  
  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return '—';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return date.toLocaleDateString('en-IN', defaultOptions);
}

/**
 * Format date as relative time (e.g., "2 minutes ago").
 * @param {object|Date|string} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';

  let date;
  if (timestamp?.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return '—';
  }

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, { hour: undefined, minute: undefined });
}

/**
 * Get status badge configuration.
 * @param {string} type - 'order' | 'payment' | 'delivery'
 * @param {string} status - The status value
 * @returns {{ label: string, className: string, color: string }}
 */
export function getStatusBadgeConfig(type, status) {
  const configs = {
    order: {
      [ORDER_STATES.PENDING]: { label: 'Pending', className: 'badge-warning', color: '#f59e0b' },
      [ORDER_STATES.CONFIRMED]: { label: 'Confirmed', className: 'badge-info', color: '#3b82f6' },
      [ORDER_STATES.PREPARING]: { label: 'Preparing', className: 'badge-purple', color: '#8b5cf6' },
      [ORDER_STATES.READY_FOR_DELIVERY]: { label: 'Ready', className: 'badge-cyan', color: '#06b6d4' },
      [ORDER_STATES.CANCELLED]: { label: 'Cancelled', className: 'badge-error', color: '#ef4444' },
      [ORDER_STATES.COMPLETED]: { label: 'Completed', className: 'badge-success', color: '#10b981' },
    },
    payment: {
      [PAYMENT_STATES.PENDING]: { label: 'Pending', className: 'badge-warning', color: '#f59e0b' },
      [PAYMENT_STATES.PAID]: { label: 'Paid', className: 'badge-success', color: '#10b981' },
      [PAYMENT_STATES.FAILED]: { label: 'Failed', className: 'badge-error', color: '#ef4444' },
      [PAYMENT_STATES.PARTIALLY_REFUNDED]: { label: 'Partial Refund', className: 'badge-orange', color: '#f97316' },
      [PAYMENT_STATES.REFUNDED]: { label: 'Refunded', className: 'badge-gray', color: '#6b7280' },
    },
    delivery: {
      [DELIVERY_STATES.NOT_DELIVERED]: { label: 'Not Delivered', className: 'badge-warning', color: '#f59e0b' },
      [DELIVERY_STATES.DELIVERED]: { label: 'Delivered', className: 'badge-success', color: '#10b981' },
    },
  };

  return configs[type]?.[status] || { label: status, className: 'badge-default', color: '#6b7280' };
}

/**
 * Truncate a string to a maximum length.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength) + '…';
}

/**
 * Format phone number for display.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '—';
  if (phone.startsWith('+91')) {
    const digits = phone.slice(3);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

/**
 * Generate a short order display ID.
 * @param {string} orderId
 * @returns {string}
 */
export function formatOrderId(orderId) {
  if (!orderId) return '—';
  if (orderId.startsWith('ORD-')) return orderId;
  return `ORD-${orderId.substring(0, 8).toUpperCase()}`;
}

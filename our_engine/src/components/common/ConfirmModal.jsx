/* ============================================================
   CONFIRM MODAL — Reusable confirmation dialog
   ============================================================ */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} props.confirmLabel
 * @param {string} props.cancelLabel
 * @param {'primary'|'danger'|'warning'} props.variant
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 * @param {boolean} props.loading
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const btnClass = variant === 'danger' ? 'btn-danger' : variant === 'warning' ? 'btn-warning' : 'btn-primary';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon btn-ghost" onClick={onCancel} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`btn ${btnClass}`} onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner spinner-sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

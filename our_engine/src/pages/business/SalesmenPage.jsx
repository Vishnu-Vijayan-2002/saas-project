/* ============================================================
   SALESMEN PAGE — Delivery Staff Management
   Create salesman accounts with custom claims, view delivery activity.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeToTenantUsers,
  createSalesmanUser,
  updateUserStatus,
} from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function SalesmenPage() {
  const { tenantId } = useTenant();
  const { showSuccess, showError } = useToast();

  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsub = subscribeToTenantUsers(tenantId, (users) => {
      setSalesmen(users.filter((u) => u.role === 'SALESMAN'));
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  const activeCount = salesmen.filter((s) => s.status === 'ACTIVE').length;

  const handleOpenModal = () => {
    setFormData({
      displayName: '',
      email: '',
      phone: '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateSalesman = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.displayName) {
      showError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      // Ensure phone is E.164 formatted if provided
      let formattedPhone = formData.phone.trim();
      if (formattedPhone) {
        // If it's a standard 10-digit Indian number, add +91
        if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
          formattedPhone = '+91' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
      }

      await createSalesmanUser(tenantId, { ...formData, phone: formattedPhone || undefined });
      showSuccess(`Salesman account created for ${formData.displayName}!`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to create salesman account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (salesman) => {
    try {
      const next = salesman.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await updateUserStatus(tenantId, salesman.uid || salesman.id, next);
      showSuccess(`Salesman ${next === 'ACTIVE' ? 'activated' : 'suspended'}.`);
    } catch (err) {
      showError('Failed to change status.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading delivery staff..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Delivery Salesmen & Staff"
        description="Manage assigned delivery agents. Salesmen receive real-time notifications for ready orders."
        actions={
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Salesman
          </button>
        }
      />

      {/* Metrics */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Total Salesmen"
          value={salesmen.length}
          subtitle="Registered staff"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <StatCard
          title="Active On Duty"
          value={activeCount}
          subtitle="Ready to fulfill orders"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          title="Suspended / Off"
          value={salesmen.length - activeCount}
          subtitle="Inactive accounts"
          variant="warning"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Salesmen List */}
      {salesmen.length === 0 ? (
        <EmptyState
          icon="users"
          title="No salesmen registered yet"
          description="Create your first salesman account so they can be assigned theater seat or restaurant deliveries."
          action={
            <button className="btn btn-primary" onClick={handleOpenModal}>
              Add Salesman
            </button>
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Salesman</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesmen.map((s) => (
                <tr key={s.uid || s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--color-success)',
                        }}
                      >
                        {(s.displayName || 'S')[0].toUpperCase()}
                      </div>
                      <strong>{s.displayName || 'Salesman'}</strong>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.email}</td>
                  <td>{s.phone || '—'}</td>
                  <td>
                    <StatusBadge status={s.status} type="order" />
                  </td>
                  <td>
                    <span className="badge badge-default">SALESMAN</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn ${s.status === 'ACTIVE' ? 'btn-ghost' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => handleToggleStatus(s)}
                    >
                      {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Salesman Account</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSalesman}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  This creates a Firebase Authentication user with dedicated custom claims strictly limited to delivery actions.
                </p>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Login Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. ramesh@theater.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="919876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating User...' : 'Create Salesman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUPER ADMIN — TENANTS PAGE
   Tenant Onboarding, Organization Management, Suspension & Provisioning
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { subscribeToTenants, createTenant, updateTenant } from '../../services/tenantService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function TenantsPage() {
  const { showSuccess, showError } = useToast();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    type: 'THEATER',
    contactEmail: '',
    contactPhone: '',
    address: '',
    taxRate: 5.0,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToTenants((tenantList) => {
      setTenants(tenantList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredTenants = tenants.filter((t) => {
    const nameMatch =
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'ALL' || t.status === statusFilter;
    const typeMatch = typeFilter === 'ALL' || t.type === typeFilter;
    return nameMatch && statusMatch && typeMatch;
  });

  const activeCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const theaterCount = tenants.filter((t) => t.type === 'THEATER').length;
  const restaurantCount = tenants.filter((t) => t.type === 'RESTAURANT').length;

  const handleOpenModal = () => {
    setFormData({
      businessName: '',
      type: 'THEATER',
      contactEmail: '',
      contactPhone: '',
      address: '',
      taxRate: 5.0,
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!formData.businessName || !formData.adminEmail || !formData.adminPassword) {
      showError('Please fill in business name and initial admin account details.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      showError('Admin password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await createTenant({
        businessName: formData.businessName.trim(),
        name: formData.businessName.trim(),
        type: formData.type,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        taxRate: Number(formData.taxRate),
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
      });

      showSuccess(`Tenant organization "${formData.businessName}" created successfully!`);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Failed to create tenant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant) => {
    try {
      const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await updateTenant({
        tenantId: tenant.id,
        updates: { status: nextStatus },
      });
      showSuccess(`Tenant ${nextStatus === 'ACTIVE' ? 'activated' : 'suspended'}.`);
    } catch (err) {
      showError('Failed to change tenant status.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading tenant organizations..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Tenants & Organizations"
        description="Provision, monitor, configure, and isolate business accounts across theaters and food counters."
        actions={
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New Tenant
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Total Businesses"
          value={tenants.length}
          subtitle="Onboarded tenants"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
        <StatCard
          title="Active Organizations"
          value={activeCount}
          subtitle="Live & receiving orders"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          title="Cinema Theaters"
          value={theaterCount}
          subtitle="Seat delivery enabled"
          variant="info"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          }
        />
        <StatCard
          title="Restaurants & Food"
          value={restaurantCount}
          subtitle="Dine-in & counter"
          variant="warning"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by business name or contact email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              🔍
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">All Types</option>
              <option value="THEATER">Theaters</option>
              <option value="RESTAURANT">Restaurants</option>
              <option value="FOOD_COUNTER">Food Counters</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      {filteredTenants.length === 0 ? (
        <EmptyState
          icon="business"
          title="No tenants found"
          description="Create your first tenant organization to provision a business."
          action={
            <button className="btn btn-primary" onClick={handleOpenModal}>
              Create Tenant
            </button>
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div>
                      <strong>{t.businessName || t.name}</strong>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                        ID: {t.id}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-default" style={{ fontSize: '0.8rem' }}>
                      {t.type || 'OTHER'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{t.contactEmail || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{t.contactPhone || ''}</div>
                  </td>
                  <td>
                    <StatusBadge status={t.status || 'ACTIVE'} type="order" />
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(t.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <a
                        href={`/order/${t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        Visit Catalog ↗
                      </a>
                      <button
                        className={`btn ${t.status === 'ACTIVE' ? 'btn-ghost' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleToggleStatus(t)}
                      >
                        {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Tenant Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Provision New Business Tenant</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTenant}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-primary-400)', margin: 0 }}>
                    ⚡ This automatically creates an isolated tenant environment, initializes Firestore configuration, and provisions the first Business Admin user with strict RBAC custom claims.
                  </p>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Organization Info</h4>

                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Grand PVR Cinemas / Spice Garden"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Business Type</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="THEATER">Cinema Theater</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="FOOD_COUNTER">Food Counter / Stall</option>
                      <option value="OTHER">Other Business</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">GST / Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="contact@theater.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="919876543210"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>
                  Initial Business Admin Account
                </h4>

                <div className="form-group">
                  <label className="form-label">Admin Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Vijay (General Manager)"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Admin Login Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="admin@theater.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admin Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
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
                  {submitting ? 'Provisioning...' : 'Provision Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

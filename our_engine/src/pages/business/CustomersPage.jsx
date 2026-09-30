/* ============================================================
   CUSTOMERS PAGE — Customer Relationship Management
   Customer directory, spending habits, WhatsApp contact links.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { subscribeToCustomers } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function CustomersPage() {
  const { tenantId } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsub = subscribeToCustomers(tenantId, (custs) => {
      setCustomers(custs);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);

  const handleOpenWhatsApp = (phone) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading customers..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Customer Directory"
        description="View repeat customers, ordering history, and direct WhatsApp contact channels."
      />

      {/* Stats */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle="Registered or ordering contacts"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          title="Total Orders Placed"
          value={totalOrdersAll}
          subtitle="Across all customers"
          variant="info"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
        <StatCard
          title="Customer Lifetime Value"
          value={formatCurrency(totalSpentAll)}
          subtitle="Cumulative sales"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* Search */}
      <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            🔍
          </span>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon="users"
          title="No customers found"
          description="Customers will appear here automatically when they place an order via WhatsApp or QR code."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th style={{ textAlign: 'right' }}>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--color-primary-400)',
                        }}
                      >
                        {(c.name || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <strong>{c.name || 'Guest Customer'}</strong>
                        {c.email && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {c.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace' }}>{c.phone || '—'}</span>
                  </td>
                  <td>
                    <span className="badge badge-info">{c.orderCount || 1} orders</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--color-primary-400)' }}>
                      {formatCurrency(c.totalSpent || 0)}
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(c.lastOrderAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {c.phone ? (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', color: '#25D366', borderColor: '#25D366' }}
                        onClick={() => handleOpenWhatsApp(c.phone)}
                      >
                        💬 Chat on WhatsApp
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No phone</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

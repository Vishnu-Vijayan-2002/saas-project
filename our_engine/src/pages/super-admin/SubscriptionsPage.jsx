/* ============================================================
   SUPER ADMIN — SUBSCRIPTIONS & BILLING
   Manage tenant subscription statuses, billing cycles, renewals.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { subscribeToTenants } from '../../services/tenantService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SubscriptionsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToTenants((tList) => {
      setTenants(tList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Loading subscriptions..." />;

  return (
    <div className="page-container">
      <PageHeader
        title="Tenant Subscriptions"
        description="Monitor active subscription plans, payment cycles, and renewal statuses across all tenants."
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Plan Tier</th>
              <th>Billing Status</th>
              <th>Monthly Fee</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.businessName || t.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{t.contactEmail}</div>
                </td>
                <td>
                  <span className="badge badge-info">{t.plan || 'Pro Tier'}</span>
                </td>
                <td>
                  <StatusBadge status={t.status || 'ACTIVE'} type="order" />
                </td>
                <td>
                  <strong>{formatCurrency(4999)}</strong> / mo
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {formatDate(t.createdAt)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    Change Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

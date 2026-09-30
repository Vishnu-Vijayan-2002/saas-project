/* ============================================================
   BUSINESS ADMIN DASHBOARD
   ============================================================ */

import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { useTenant } from '../../context/TenantContext';

export default function BusinessDashboard() {
  const { tenantName } = useTenant();

  return (
    <>
      <PageHeader
        title={`${tenantName} Dashboard`}
        description="Overview of today's business activity"
      />

      <div className="stats-grid">
        <StatCard
          label="Today's Orders"
          value="0"
          color="var(--color-accent)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          }
        />
        <StatCard
          label="Revenue Today"
          value="₹0"
          color="var(--color-success)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Pending Delivery"
          value="0"
          color="var(--color-warning)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Active Salesmen"
          value="0"
          color="var(--color-info)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Orders</h3>
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <p className="text-muted">No orders yet today.</p>
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
          <div className="flex flex-col gap-2" style={{ padding: 'var(--space-2) 0' }}>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
              Manage Products
            </button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              Manage Salesmen
            </button>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Create Campaign
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

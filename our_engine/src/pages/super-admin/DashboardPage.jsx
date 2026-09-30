/* ============================================================
   SUPER ADMIN DASHBOARD
   ============================================================ */

import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

export default function SuperAdminDashboard() {
  return (
    <>
      <PageHeader
        title="Platform Overview"
        description="Monitor tenants, usage, and platform health"
      />

      <div className="stats-grid">
        <StatCard
          label="Total Tenants"
          value="0"
          color="var(--color-accent)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
            </svg>
          }
        />
        <StatCard
          label="Active Tenants"
          value="0"
          color="var(--color-success)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value="0"
          color="var(--color-info)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          }
        />
        <StatCard
          label="Platform Revenue"
          value="₹0"
          color="var(--color-purple)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
      </div>

      <div className="card mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Tenants</h3>
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <p className="text-muted">No tenants created yet. Create your first tenant to get started.</p>
        </div>
      </div>
    </>
  );
}

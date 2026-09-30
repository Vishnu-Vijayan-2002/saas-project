/* ============================================================
   SUPER ADMIN — USAGE & PLATFORM METRICS
   Aggregated platform volume, WhatsApp API quotas, delivery times.
   ============================================================ */

import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/formatters';

export default function UsagePage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Platform Usage & Health"
        description="Global system telemetry, WhatsApp Cloud API message throughput, and order loads."
      />

      <div className="stats-grid mb-6">
        <StatCard
          title="Total Orders Processed"
          value="48,290"
          subtitle="+14% this month"
          variant="primary"
          icon={<span style={{ fontSize: '1.5rem' }}>🛍️</span>}
        />
        <StatCard
          title="Gross Merchandise Value"
          value={formatCurrency(1842000)}
          subtitle="Processed via Razorpay"
          variant="success"
          icon={<span style={{ fontSize: '1.5rem' }}>💳</span>}
        />
        <StatCard
          title="WhatsApp Messages Sent"
          value="129,480"
          subtitle="99.4% delivery rate"
          variant="info"
          icon={<span style={{ fontSize: '1.5rem' }}>💬</span>}
        />
        <StatCard
          title="Active Salesmen Online"
          value="84"
          subtitle="Across all tenants"
          variant="warning"
          icon={<span style={{ fontSize: '1.5rem' }}>🏃</span>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>WhatsApp Cloud API Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Quality Rating:</span>
              <strong style={{ color: 'var(--color-success)' }}>High (Green)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Daily Message Limit:</span>
              <span>100,000 / day</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Webhook Latency:</span>
              <span>142 ms</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Firebase & Cloud Functions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Cloud Functions Invocation:</span>
              <span>320,410 calls</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Average Execution Time:</span>
              <span>210 ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Firestore Document Writes:</span>
              <span>85,120</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUPER ADMIN — PLANS & PRICING TIERS
   Configure subscription plans, order volume limits, feature flags.
   ============================================================ */

import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Counter',
    price: 1999,
    billingPeriod: 'month',
    orderLimit: 1000,
    whatsappLimit: 2500,
    salesmenLimit: 3,
    theatersSupport: false,
    activeTenants: 12,
    features: ['QR Menu & Ordering', '3 Delivery Salesmen', 'Razorpay Payment Gateway', 'WhatsApp Receipts'],
  },
  {
    id: 'pro',
    name: 'Cinema & Restaurant Pro',
    price: 4999,
    billingPeriod: 'month',
    orderLimit: 10000,
    whatsappLimit: 25000,
    salesmenLimit: 15,
    theatersSupport: true,
    activeTenants: 28,
    features: ['Theater Seat Delivery', '15 Delivery Salesmen', 'Marketing Broadcasts', 'Movie Trailers & Promotions', 'Priority Support'],
  },
  {
    id: 'enterprise',
    name: 'Multiplex Enterprise',
    price: 14999,
    billingPeriod: 'month',
    orderLimit: 'Unlimited',
    whatsappLimit: 100000,
    salesmenLimit: 50,
    theatersSupport: true,
    activeTenants: 6,
    features: ['Multi-Screen Multiplex', 'Unlimited Orders', 'Dedicated WhatsApp Number', 'Custom Webhooks & ERP Sync', '24/7 SLA Support'],
  },
];

export default function PlansPage() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    orderLimit: 5000,
    whatsappLimit: 10000,
    salesmenLimit: 10,
  });

  const totalMRR = plans.reduce((sum, p) => sum + p.price * p.activeTenants, 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Subscription Plans & Tiers"
        description="Define SaaS pricing packages, monthly quotas, and tier feature capabilities."
        actions={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Plan
          </button>
        }
      />

      <div className="stats-grid mb-6">
        <StatCard
          title="Platform MRR"
          value={formatCurrency(totalMRR)}
          subtitle="Monthly Recurring Revenue"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          title="Active Paid Subscriptions"
          value={plans.reduce((acc, p) => acc + p.activeTenants, 0)}
          subtitle="Subscribed organizations"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          }
        />
        <StatCard
          title="Active Plans"
          value={plans.length}
          subtitle="Tier options offered"
          variant="info"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              borderColor: plan.id === 'pro' ? 'var(--color-primary-500)' : undefined,
            }}
          >
            {plan.id === 'pro' && (
              <span
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  backgroundColor: 'var(--color-primary-600)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}
              >
                POPULAR
              </span>
            )}

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{plan.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {formatCurrency(plan.price)}
              </span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>/ {plan.billingPeriod}</span>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div>📊 Orders: <strong>{typeof plan.orderLimit === 'number' ? plan.orderLimit.toLocaleString() : plan.orderLimit} / mo</strong></div>
              <div>💬 WhatsApp: <strong>{plan.whatsappLimit.toLocaleString()} messages</strong></div>
              <div>🏃 Max Salesmen: <strong>{plan.salesmenLimit} agents</strong></div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              {plan.features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <strong>{plan.activeTenants}</strong> businesses on this plan
              </span>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                Edit Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Pricing Tier</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Plan Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Cinema Gold" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Price (₹)</label>
                  <input type="number" className="form-control" placeholder="7999" required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

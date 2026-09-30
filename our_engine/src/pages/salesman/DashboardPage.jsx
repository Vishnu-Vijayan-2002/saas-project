/* ============================================================
   SALESMAN DASHBOARD — Simplified delivery-focused interface
   Only: View Orders, Check Payment, DELIVERED / NOT DELIVERED
   ============================================================ */

import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { DELIVERY_ATTEMPT_REASONS } from '../../utils/constants';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';

export default function SalesmanDashboard() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { success, error: toastError } = useToast();
  const { orders, loading, error } = useOrders();

  const [deliveryModal, setDeliveryModal] = useState({ open: false, order: null, type: null });
  const [notDeliveredReason, setNotDeliveredReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const pendingCount = orders.length;

  const handleDelivered = async () => {
    if (!deliveryModal.order || !tenantId) return;
    setActionLoading(true);

    try {
      const orderRef = doc(db, 'tenants', tenantId, 'orders', deliveryModal.order.id);
      await updateDoc(orderRef, {
        deliveryStatus: 'DELIVERED',
        deliveredAt: serverTimestamp(),
        deliveredBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      success('Order Delivered', `Order #${deliveryModal.order.orderNumber || deliveryModal.order.id} has been marked as delivered.`);
      setDeliveryModal({ open: false, order: null, type: null });
    } catch (err) {
      console.error('Delivery update error:', err);
      toastError('Update Failed', 'Could not update delivery status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotDelivered = async () => {
    if (!deliveryModal.order || !tenantId || !notDeliveredReason) return;
    setActionLoading(true);

    try {
      const orderRef = doc(db, 'tenants', tenantId, 'orders', deliveryModal.order.id);
      await updateDoc(orderRef, {
        lastDeliveryAttempt: {
          attemptedBy: user.uid,
          attemptedAt: serverTimestamp(),
          reason: notDeliveredReason,
        },
        updatedAt: serverTimestamp(),
      });
      success('Attempt Recorded', 'Delivery attempt has been recorded.');
      setDeliveryModal({ open: false, order: null, type: null });
      setNotDeliveredReason('');
    } catch (err) {
      console.error('Delivery attempt error:', err);
      toastError('Update Failed', 'Could not record delivery attempt. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Delivery Dashboard"
        description="Your assigned orders ready for delivery"
      />

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          label="Pending Delivery"
          value={pendingCount}
          color="var(--color-warning)"
        />
        <StatCard
          label="Delivered Today"
          value="—"
          color="var(--color-success)"
        />
      </div>

      {/* Order List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="spinner spinner-lg" />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p className="text-error">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="orders"
          title="No pending deliveries"
          description="All caught up! Orders assigned to you will appear here when they're ready for delivery."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Order header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
                    #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                  </h3>
                  <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {formatRelativeTime(order.createdAt)}
                  </span>
                </div>
                <StatusBadge type="payment" status={order.paymentStatus} />
              </div>

              {/* Customer info */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>Customer:</strong> {order.customer?.name || 'Unknown'}
                </p>
                {order.customer?.phone && (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <strong>Phone:</strong> {order.customer.phone}
                  </p>
                )}
              </div>

              {/* Items */}
              <div
                style={{
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between"
                    style={{
                      padding: 'var(--space-1) 0',
                      fontSize: 'var(--font-size-sm)',
                      borderBottom: i < order.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <span>{item.name} × {item.quantity}</span>
                    <span className="text-muted">{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                <div
                  className="flex justify-between"
                  style={{
                    paddingTop: 'var(--space-2)',
                    marginTop: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Delivery status */}
              <div className="flex items-center gap-2 mb-4">
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Delivery:</span>
                <StatusBadge type="delivery" status={order.deliveryStatus} />
              </div>

              {/* ONLY these two actions — no Accept/Reject/Cancel/Refund */}
              <div className="flex gap-3">
                <button
                  className="btn btn-success flex-1"
                  onClick={() => setDeliveryModal({ open: true, order, type: 'delivered' })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  DELIVERED
                </button>
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => setDeliveryModal({ open: true, order, type: 'not_delivered' })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                  NOT DELIVERED
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivered confirmation modal */}
      <ConfirmModal
        isOpen={deliveryModal.open && deliveryModal.type === 'delivered'}
        title="Confirm Delivery"
        message={`Mark order #${deliveryModal.order?.orderNumber || deliveryModal.order?.id?.substring(0, 8) || ''} as delivered?`}
        confirmLabel="Yes, Delivered"
        variant="primary"
        onConfirm={handleDelivered}
        onCancel={() => setDeliveryModal({ open: false, order: null, type: null })}
        loading={actionLoading}
      />

      {/* Not Delivered modal with reason */}
      {deliveryModal.open && deliveryModal.type === 'not_delivered' && (
        <div className="modal-overlay" onClick={() => setDeliveryModal({ open: false, order: null, type: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Not Delivered — Select Reason</h3>
              <button
                className="btn-icon btn-ghost"
                onClick={() => setDeliveryModal({ open: false, order: null, type: null })}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason</label>
                <select
                  className="form-input form-select"
                  value={notDeliveredReason}
                  onChange={(e) => setNotDeliveredReason(e.target.value)}
                >
                  <option value="">Select a reason...</option>
                  {Object.entries(DELIVERY_ATTEMPT_REASONS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDeliveryModal({ open: false, order: null, type: null });
                  setNotDeliveredReason('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={handleNotDelivered}
                disabled={actionLoading || !notDeliveredReason}
              >
                {actionLoading ? <span className="spinner spinner-sm" /> : null}
                Record Attempt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

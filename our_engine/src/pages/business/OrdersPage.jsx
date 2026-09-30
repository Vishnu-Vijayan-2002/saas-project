/* ============================================================
   ORDERS PAGE — Multi-Tenant Order Management (Business Admin)
   Features real-time state machine transitions, salesman assignment,
   cancellations, and server-side refunds.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { useOrders } from '../../hooks/useOrders';
import {
  updateOrderStatus,
  cancelOrder,
  assignSalesman,
} from '../../services/orderService';
import { createRefund } from '../../services/refundService';
import { subscribeToTenantUsers } from '../../services/userService';
import {
  ORDER_STATES,
  PAYMENT_STATES,
  DELIVERY_STATES,
} from '../../utils/constants';
import {
  canTransitionOrderStatus,
  canCancelOrder,
  canRefundOrder,
} from '../../utils/orderStateMachine';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function OrdersPage() {
  const { tenantId } = useTenant();
  const { showSuccess, showError } = useToast();

  // Filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time orders hook
  const { orders, loading, error } = useOrders({ limitCount: 100 });

  // Salesmen list for assignment
  const [salesmen, setSalesmen] = useState([]);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Assign salesman modal
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');

  // Cancel modal
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Refund modal
  const [refundingOrder, setRefundingOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    const unsubSalesmen = subscribeToTenantUsers(tenantId, (users) => {
      setSalesmen(users.filter((u) => u.role === 'SALESMAN' && u.status === 'ACTIVE'));
    });

    return () => unsubSalesmen();
  }, [tenantId]);

  // Tab & search filtering
  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === 'PENDING' && order.orderStatus !== ORDER_STATES.PENDING) return false;
    if (activeTab === 'CONFIRMED' && order.orderStatus !== ORDER_STATES.CONFIRMED) return false;
    if (activeTab === 'PREPARING' && order.orderStatus !== ORDER_STATES.PREPARING) return false;
    if (activeTab === 'READY' && order.orderStatus !== ORDER_STATES.READY_FOR_DELIVERY) return false;
    if (activeTab === 'DELIVERED' && order.deliveryStatus !== DELIVERY_STATES.DELIVERED) return false;
    if (activeTab === 'CANCELLED' && order.orderStatus !== ORDER_STATES.CANCELLED) return false;

    // Payment filter
    if (paymentFilter !== 'ALL' && order.paymentStatus !== paymentFilter) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id?.toLowerCase().includes(q);
      const matchCustomer = order.customer?.name?.toLowerCase().includes(q);
      const matchPhone = order.customer?.phone?.includes(q);
      const matchLocation =
        order.deliveryLocation?.seatNumber?.toLowerCase().includes(q) ||
        order.deliveryLocation?.tableName?.toLowerCase().includes(q);
      return matchId || matchCustomer || matchPhone || matchLocation;
    }

    return true;
  });

  // Metrics
  const pendingCount = orders.filter((o) => o.orderStatus === ORDER_STATES.PENDING).length;
  const preparingCount = orders.filter((o) => o.orderStatus === ORDER_STATES.PREPARING).length;
  const readyCount = orders.filter((o) => o.orderStatus === ORDER_STATES.READY_FOR_DELIVERY).length;
  const todayTotal = orders
    .filter((o) => o.paymentStatus === PAYMENT_STATES.PAID)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Status progression action
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATES.PENDING:
        return { next: ORDER_STATES.CONFIRMED, label: 'Confirm Order', color: 'primary' };
      case ORDER_STATES.CONFIRMED:
        return { next: ORDER_STATES.PREPARING, label: 'Start Preparing', color: 'primary' };
      case ORDER_STATES.PREPARING:
        return { next: ORDER_STATES.READY_FOR_DELIVERY, label: 'Mark Ready', color: 'success' };
      default:
        return null;
    }
  };

  const handleAdvanceStatus = async (order, nextStatus) => {
    setActionLoading(true);
    try {
      await updateOrderStatus({
        tenantId,
        orderId: order.id,
        newStatus: nextStatus,
      });
      showSuccess(`Order transitioned to ${nextStatus}`);
    } catch (err) {
      showError(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSalesman = async (e) => {
    e.preventDefault();
    if (!assigningOrder || !selectedSalesmanId) return;

    setActionLoading(true);
    try {
      await assignSalesman({
        tenantId,
        orderId: assigningOrder.id,
        salesmanId: selectedSalesmanId,
      });
      showSuccess('Salesman assigned successfully!');
      setAssigningOrder(null);
    } catch (err) {
      showError(err.message || 'Failed to assign salesman');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelingOrder) return;

    setActionLoading(true);
    try {
      await cancelOrder({
        tenantId,
        orderId: cancelingOrder.id,
        reason: cancelReason || 'Cancelled by business admin',
        idempotencyKey: uuidv4(),
      });
      showSuccess('Order cancelled successfully.');
      setCancelingOrder(null);
      setCancelReason('');
    } catch (err) {
      showError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundingOrder || !refundAmount) return;

    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > refundingOrder.total) {
      showError('Please enter a valid refund amount up to order total.');
      return;
    }

    setActionLoading(true);
    try {
      await createRefund({
        tenantId,
        orderId: refundingOrder.id,
        amount: amountNum,
        reason: refundReason || 'Requested by customer',
        idempotencyKey: uuidv4(),
      });
      showSuccess(`Refund of ₹${amountNum.toFixed(2)} initiated successfully.`);
      setRefundingOrder(null);
      setRefundAmount('');
      setRefundReason('');
    } catch (err) {
      showError(err.message || 'Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Streaming live orders..." />;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Live Orders"
        description="Monitor, prepare, assign salesmen, and fulfill customer WhatsApp & counter orders."
      />

      {/* Metrics Row */}
      <div className="stats-grid mb-6">
        <StatCard
          title="Awaiting Confirmation"
          value={pendingCount}
          subtitle="New incoming orders"
          variant={pendingCount > 0 ? 'warning' : 'primary'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          title="Currently Preparing"
          value={preparingCount}
          subtitle="In kitchen / counter"
          variant="info"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          }
        />
        <StatCard
          title="Ready for Delivery"
          value={readyCount}
          subtitle="Awaiting salesman dispatch"
          variant="success"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18H9" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10" />
              <circle cx="17" cy="18" r="2" />
              <circle cx="7" cy="18" r="2" />
            </svg>
          }
        />
        <StatCard
          title="Paid Revenue"
          value={formatCurrency(todayTotal)}
          subtitle="Successful transactions"
          variant="primary"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* Tabs & Search Bar */}
      <div className="card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            {[
              { id: 'ALL', label: 'All Orders', count: orders.length },
              { id: 'PENDING', label: 'Pending', count: pendingCount },
              { id: 'CONFIRMED', label: 'Confirmed', count: orders.filter((o) => o.orderStatus === ORDER_STATES.CONFIRMED).length },
              { id: 'PREPARING', label: 'Preparing', count: preparingCount },
              { id: 'READY', label: 'Ready', count: readyCount },
              { id: 'DELIVERED', label: 'Delivered', count: orders.filter((o) => o.deliveryStatus === DELIVERY_STATES.DELIVERED).length },
              { id: 'CANCELLED', label: 'Cancelled', count: orders.filter((o) => o.orderStatus === ORDER_STATES.CANCELLED).length },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '20px' }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span
                  style={{
                    marginLeft: '6px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by order ID, customer name, phone, or seat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                🔍
              </span>
            </div>

            <select
              className="form-control"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '170px' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value={PAYMENT_STATES.PAID}>Paid</option>
              <option value={PAYMENT_STATES.PENDING}>Payment Pending</option>
              <option value={PAYMENT_STATES.REFUNDED}>Refunded</option>
              <option value={PAYMENT_STATES.PARTIALLY_REFUNDED}>Partially Refunded</option>
              <option value={PAYMENT_STATES.FAILED}>Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="No matching orders"
          description="There are no orders matching your current filter criteria."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOrders.map((order) => {
            const nextAction = getNextStatus(order.orderStatus);
            const canCancel = canCancelOrder(order.orderStatus);
            const canRefund = canRefundOrder(order.orderStatus, order.paymentStatus);
            const salesmanName = salesmen.find((s) => s.uid === order.assignedSalesmanId)?.displayName;

            return (
              <div
                key={order.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: `4px solid ${
                    order.orderStatus === ORDER_STATES.READY_FOR_DELIVERY
                      ? 'var(--color-success)'
                      : order.orderStatus === ORDER_STATES.PREPARING
                      ? 'var(--color-primary-400)'
                      : order.orderStatus === ORDER_STATES.CANCELLED
                      ? 'var(--color-danger)'
                      : 'var(--color-border)'
                  }`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {formatRelativeTime(order.createdAt)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                      <span>👤 {order.customer?.name || 'Customer'} ({order.customer?.phone || 'No phone'})</span>
                      {order.deliveryLocation?.seatNumber && (
                        <span>💺 Seat: <strong>{order.deliveryLocation.seatNumber}</strong></span>
                      )}
                      {order.deliveryLocation?.tableName && (
                        <span>🍽️ Table: <strong>{order.deliveryLocation.tableName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* 3 Status Badges */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={order.orderStatus} type="order" />
                    <StatusBadge status={order.paymentStatus} type="payment" />
                    <StatusBadge status={order.deliveryStatus} type="delivery" />
                  </div>
                </div>

                {/* Items summary */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      ITEMS ({order.items?.length || 0})
                    </span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--color-primary-400)' }}>
                      {formatCurrency(order.total || 0)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {order.items?.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.85rem',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        <strong>{item.quantity}x</strong> {item.name || item.productId}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Salesman info & footer actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Salesman:</span>
                    {salesmanName ? (
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        🏃 {salesmanName}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
                    )}

                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setAssigningOrder(order);
                        setSelectedSalesmanId(order.assignedSalesmanId || (salesmen[0]?.uid || ''));
                      }}
                    >
                      {order.assignedSalesmanId ? 'Change' : 'Assign'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      View Details
                    </button>

                    {/* Next step button */}
                    {nextAction && (
                      <button
                        className={`btn btn-${nextAction.color}`}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                        onClick={() => handleAdvanceStatus(order, nextAction.next)}
                        disabled={actionLoading}
                      >
                        {nextAction.label}
                      </button>
                    )}

                    {/* Refund button */}
                    {canRefund && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                        onClick={() => {
                          setRefundingOrder(order);
                          setRefundAmount(order.total?.toString() || '');
                        }}
                      >
                        Refund
                      </button>
                    )}

                    {/* Cancel button */}
                    {canCancel && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => setCancelingOrder(order)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Salesman Modal */}
      {assigningOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Delivery Salesman</h3>
              <button className="btn-close" onClick={() => setAssigningOrder(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAssignSalesman}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  Assign order <strong>#{assigningOrder.id.slice(-6).toUpperCase()}</strong> to an active delivery staff member.
                </p>

                <div className="form-group">
                  <label className="form-label">Select Salesman</label>
                  {salesmen.length === 0 ? (
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                      No active salesmen found. Please create salesman accounts in the Staff page first.
                    </p>
                  ) : (
                    <select
                      className="form-control"
                      value={selectedSalesmanId}
                      onChange={(e) => setSelectedSalesmanId(e.target.value)}
                      required
                    >
                      {salesmen.map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.displayName || s.email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningOrder(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || salesmen.length === 0}
                >
                  {actionLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelingOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Cancel Order #{cancelingOrder.id.slice(-6).toUpperCase()}</h3>
              <button className="btn-close" onClick={() => setCancelingOrder(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Canceling this order will restore reserved product stock. If the customer has already paid, a refund flag will be set.
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="e.g. Customer requested cancellation / Item out of stock"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCancelingOrder(null)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundingOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Process Order Refund</h3>
              <button className="btn-close" onClick={() => setRefundingOrder(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleProcessRefund}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)', margin: 0 }}>
                    ⚡ Refunds are processed securely through payment gateway API. The payment status will only update after gateway confirmation.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    max={refundingOrder.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                    Maximum eligible refund: {formatCurrency(refundingOrder.total)}
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Refund *</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Delivery issue, customer complaint"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRefundingOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : `Refund ₹${refundAmount || 0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Drawer / Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Order Details #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
              <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Status pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={selectedOrder.orderStatus} type="order" />
                <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                <StatusBadge status={selectedOrder.deliveryStatus} type="delivery" />
              </div>

              {/* Customer info */}
              <div className="card" style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Customer & Delivery</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>Name: <strong>{selectedOrder.customer?.name || 'Guest'}</strong></div>
                  <div>Phone: <strong>{selectedOrder.customer?.phone || 'N/A'}</strong></div>
                  <div>Location: <strong>{selectedOrder.deliveryLocation?.seatNumber ? `Seat ${selectedOrder.deliveryLocation.seatNumber}` : selectedOrder.deliveryLocation?.tableName ? `Table ${selectedOrder.deliveryLocation.tableName}` : 'Counter Pickup'}</strong></div>
                  <div>Placed At: <strong>{formatDate(selectedOrder.createdAt)}</strong></div>
                </div>
              </div>

              {/* Items breakdown */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Items Breakdown</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name || item.productId}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price || 0)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-400)' }}>
                        {formatCurrency(selectedOrder.total || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

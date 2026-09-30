/* ============================================================
   CUSTOMER ORDER STATUS PAGE — Real-time Live Order Tracking
   Live Firestore subscription to order progress & delivery state.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToOrder } from '../../services/orderService';
import { ORDER_STATES, DELIVERY_STATES, PAYMENT_STATES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CustomerOrderStatusPage() {
  const { tenantId, orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !orderId) return;

    setLoading(true);
    const unsub = subscribeToOrder(tenantId, orderId, (orderData) => {
      setOrder(orderData);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId, orderId]);

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving live order status..." />;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          We could not locate this order. It may have expired or the ID is incorrect.
        </p>
        <button className="btn btn-primary" onClick={() => navigate(`/order/${tenantId}`)}>
          Go to Menu
        </button>
      </div>
    );
  }

  // Stepper calculations
  const steps = [
    { label: 'Order Received', desc: 'Payment confirmed & received' },
    { label: 'Preparing', desc: 'Freshly making in kitchen' },
    { label: 'Ready & Dispatched', desc: 'Salesman on the way' },
    { label: 'Delivered', desc: 'Enjoy your snacks!' },
  ];

  let currentStepIndex = 0;
  if (order.deliveryStatus === DELIVERY_STATES.DELIVERED) {
    currentStepIndex = 3;
  } else if (order.orderStatus === ORDER_STATES.READY_FOR_DELIVERY) {
    currentStepIndex = 2;
  } else if (order.orderStatus === ORDER_STATES.PREPARING) {
    currentStepIndex = 1;
  } else {
    currentStepIndex = 0;
  }

  const isDelivered = order.deliveryStatus === DELIVERY_STATES.DELIVERED;
  const isCancelled = order.orderStatus === ORDER_STATES.CANCELLED;

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', minHeight: '100vh', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: isDelivered
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))'
            : isCancelled
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
          borderColor: isDelivered ? 'var(--color-success)' : isCancelled ? 'var(--color-danger)' : 'var(--color-primary-500)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {isDelivered ? '🎉' : isCancelled ? '❌' : '🍿'}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
          {isDelivered
            ? 'Order Delivered!'
            : isCancelled
            ? 'Order Cancelled'
            : 'Order Placed Successfully!'}
        </h1>
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Order ID: <strong>#{order.id.slice(-6).toUpperCase()}</strong>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <StatusBadge status={order.orderStatus} type="order" />
          <StatusBadge status={order.paymentStatus} type="payment" />
          <StatusBadge status={order.deliveryStatus} type="delivery" />
        </div>
      </div>

      {/* WhatsApp alert banner */}
      <div
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(37, 211, 102, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(37, 211, 102, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>💬</span>
        <div style={{ fontSize: '0.85rem' }}>
          A digital receipt and live status alerts have been sent to WhatsApp number: <strong>{order.customer?.phone}</strong>
        </div>
      </div>

      {/* Live Stepper */}
      {!isCancelled && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Live Delivery Progress
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
                  {/* Indicator icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isPast || isCurrent ? 'var(--color-primary-500)' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                      boxShadow: isCurrent ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none',
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>

                  {/* Text */}
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: isPast || isCurrent ? '#fff' : 'var(--color-text-secondary)' }}>
                      {step.label}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Destination */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivery Location</h3>
        <p style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-400)' }}>
          📍 {order.deliveryLocation?.seatNumber ? `Seat: ${order.deliveryLocation.seatNumber}` : order.deliveryLocation?.tableName ? `Table: ${order.deliveryLocation.tableName}` : 'Counter Pickup'}
        </p>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Please remain in your seat; delivery staff will bring your order directly to you.
        </span>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Ordered Items</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>{item.quantity}x {item.name || item.productId}</span>
              <strong>{formatCurrency((item.price || 0) * (item.quantity || 1))}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', fontWeight: 700 }}>
          <span>Total Paid:</span>
          <span style={{ color: 'var(--color-primary-400)', fontSize: '1.1rem' }}>{formatCurrency(order.total || 0)}</span>
        </div>
      </div>

      {/* Button to order more */}
      <button
        className="btn btn-secondary"
        style={{ padding: '0.85rem', borderRadius: '30px', marginTop: '0.5rem' }}
        onClick={() => navigate(`/order/${tenantId}`)}
      >
        Order More Items 🍿
      </button>
    </div>
  );
}

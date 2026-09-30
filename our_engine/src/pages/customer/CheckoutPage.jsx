/* ============================================================
   CUSTOMER CHECKOUT PAGE — Cloud Function Order Creation & Razorpay
   Strict Payment Rule: Frontend NEVER sets paymentStatus = PAID.
   Order -> Create Order CF -> Initiate Payment CF -> Razorpay Modal -> Verify CF -> Order Status Page
   ============================================================ */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { createOrder } from '../../services/orderService';
import {
  loadRazorpayScript,
  initiatePayment,
  openRazorpayCheckout,
  verifyPayment,
} from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CustomerCheckoutPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const {
    cartItems,
    subtotal,
    customerInfo,
    deliveryLocation,
    clearCart,
  } = useCart();

  const [processing, setProcessing] = useState(false);
  const [stepMessage, setStepMessage] = useState('');

  if (cartItems.length === 0) {
    navigate(`/order/${tenantId}`);
    return null;
  }

  const taxAmount = subtotal * 0.05;
  const grandTotal = subtotal + taxAmount;

  const handlePayNow = async () => {
    setProcessing(true);
    setStepMessage('Placing your order...');

    try {
      // 1. Create order on server via Cloud Function
      const idempotencyKey = uuidv4();
      const orderPayload = {
        tenantId,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || null,
        },
        deliveryLocation: {
          type: deliveryLocation.type || 'seat',
          seatNumber: deliveryLocation.seatNumber || null,
          tableName: deliveryLocation.tableName || null,
        },
        idempotencyKey,
      };

      const createOrderRes = await createOrder(orderPayload);
      const orderData = createOrderRes.data;
      const orderId = orderData.orderId || orderData.id;

      // 2. Load Razorpay script
      setStepMessage('Connecting to secure payment gateway...');
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 3. Initiate payment via Cloud Function
      const paymentRes = await initiatePayment({
        tenantId,
        orderId,
      });

      const { razorpayOrderId, amount, currency, keyId } = paymentRes.data;

      // 4. Open Razorpay Checkout modal
      setStepMessage('Awaiting payment authorization...');
      const razorpayOptions = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: amount,
        currency: currency || 'INR',
        name: 'OurEngine Ordering',
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: customerInfo.name,
          contact: customerInfo.phone,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      let paymentResponse;
      try {
        paymentResponse = await openRazorpayCheckout(razorpayOptions);
      } catch (userCancelErr) {
        // If user closed modal or in dev test mode without real Razorpay keys:
        console.warn('Payment modal dismissed:', userCancelErr.message);
        throw new Error(userCancelErr.message || 'Payment cancelled');
      }

      // 5. Server-side verification via Cloud Function
      setStepMessage('Verifying payment signature with bank...');
      await verifyPayment({
        tenantId,
        orderId,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      showSuccess('Payment received! Your order is placed.');
      clearCart();
      navigate(`/order/${tenantId}/status/${orderId}`);
    } catch (err) {
      console.error('Checkout error:', err);
      showError(err.message || 'Payment could not be completed.');
      setProcessing(false);
      setStepMessage('');
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', minHeight: '100vh', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.4rem 0.6rem' }}
          onClick={() => navigate(`/order/${tenantId}/cart`)}
          disabled={processing}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Checkout & Pay</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Order review */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {cartItems.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.quantity}x {item.name}</span>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
              <span>Taxes & GST (5%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
              <span>Total Payable:</span>
              <span style={{ color: 'var(--color-primary-400)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Delivery target */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivering to:</h3>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-400)' }}>
            📍 {deliveryLocation.type === 'seat' ? `Seat: ${deliveryLocation.seatNumber}` : `Table: ${deliveryLocation.tableName}`}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Recipient: <strong>{customerInfo.name}</strong> ({customerInfo.phone})
          </p>
        </div>

        {/* Security badge */}
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            100% Encrypted UPI & Card Payments powered by Razorpay.
          </span>
        </div>

        {/* Pay button */}
        <button
          className="btn btn-primary"
          style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '30px', marginTop: '0.5rem' }}
          onClick={handlePayNow}
          disabled={processing}
        >
          {processing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: '18px', height: '18px' }} />
              <span>{stepMessage}</span>
            </div>
          ) : (
            `Pay ${formatCurrency(grandTotal)} via UPI / Card`
          )}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOMER CART PAGE — Order Review & Customer Identification
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { getTenantPublicInfo } from '../../services/tenantService';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export default function CustomerCartPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const {
    cartItems,
    updateQuantity,
    removeItem,
    subtotal,
    itemCount,
    customerInfo,
    setCustomerInfo,
    deliveryLocation,
    setDeliveryLocation,
  } = useCart();

  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (tenantId) {
      getTenantPublicInfo(tenantId).then(setTenant);
    }
  }, [tenantId]);

  const taxRate = tenant?.taxRate ?? 5.0;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleProceed = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showError('Your cart is empty.');
      return;
    }

    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      showError('Please enter your name and WhatsApp number.');
      return;
    }

    const cleanPhone = customerInfo.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showError('Please enter a valid 10-digit mobile number.');
      return;
    }

    navigate(`/order/${tenantId}/checkout`);
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
        <button
          className="btn btn-ghost"
          style={{ marginBottom: '1.5rem' }}
          onClick={() => navigate(`/order/${tenantId}`)}
        >
          ← Back to Menu
        </button>
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          description="Looks like you haven't added any snacks or beverages yet."
          action={
            <button className="btn btn-primary" onClick={() => navigate(`/order/${tenantId}`)}>
              Browse Catalog
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', minHeight: '100vh', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.4rem 0.6rem' }}
          onClick={() => navigate(`/order/${tenantId}`)}
        >
          ← Menu
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Review Your Order</h1>
      </div>

      <form onSubmit={handleProceed} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Cart Items list */}
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Selected Items ({itemCount})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cartItems.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary-400)' }}>
                    {formatCurrency(item.price)} each
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 700, padding: '0 0.4rem', fontSize: '0.85rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <strong style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.95rem' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Delivery Location</h2>

          <div className="grid grid-2" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Location Type</label>
              <select
                className="form-control"
                value={deliveryLocation.type || 'seat'}
                onChange={(e) => setDeliveryLocation({ ...deliveryLocation, type: e.target.value })}
              >
                <option value="seat">Theater Seat</option>
                <option value="table">Dining Table</option>
                <option value="counter">Counter Pickup</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {deliveryLocation.type === 'seat' ? 'Seat Number *' : deliveryLocation.type === 'table' ? 'Table Number *' : 'Token ID'}
              </label>
              <input
                type="text"
                className="form-control"
                placeholder={deliveryLocation.type === 'seat' ? 'e.g. Row G - Seat 14' : 'e.g. Table 4'}
                value={deliveryLocation.type === 'seat' ? deliveryLocation.seatNumber : deliveryLocation.tableName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (deliveryLocation.type === 'seat') {
                    setDeliveryLocation({ ...deliveryLocation, seatNumber: val });
                  } else {
                    setDeliveryLocation({ ...deliveryLocation, tableName: val });
                  }
                }}
                required
              />
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Your Information</h2>
            <span style={{ fontSize: '0.8rem', color: '#25D366' }}>💬 Updates via WhatsApp</span>
          </div>

          <div className="form-group">
            <label className="form-label">Your Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rahul Sharma"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp Mobile Number *</label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              required
            />
            <small style={{ color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
              We will send your digital receipt and real-time delivery status here.
            </small>
          </div>
        </div>

        {/* Bill summary */}
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Bill Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Item Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Taxes & GST ({taxRate}%):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 700,
                fontSize: '1.15rem',
              }}
            >
              <span>To Pay:</span>
              <span style={{ color: 'var(--color-primary-400)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.85rem', fontSize: '1.05rem', borderRadius: '30px', marginTop: '0.5rem' }}
        >
          Proceed to Payment ({formatCurrency(grandTotal)}) →
        </button>
      </form>
    </div>
  );
}

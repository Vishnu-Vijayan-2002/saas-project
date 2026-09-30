/* ============================================================
   SETTINGS PAGE — Business Profile, WhatsApp, Razorpay, & QR Codes
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import { updateTenant } from '../../services/tenantService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SettingsPage() {
  const { tenantId, tenant } = useTenant();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE | QR | INTEGRATIONS
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Profile & operations form
  const [profileForm, setProfileForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    taxRate: 5.0,
    acceptOrders: true,
    autoAssignSalesman: false,
  });

  // Integrations form
  const [integrationsForm, setIntegrationsForm] = useState({
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    razorpayKeyId: '',
  });

  // QR Code generator state
  const [qrType, setQrType] = useState('SEAT'); // SEAT | TABLE | COUNTER
  const [qrIdentifier, setQrIdentifier] = useState('A-12');

  useEffect(() => {
    if (tenant) {
      setProfileForm({
        name: tenant.name || tenant.businessName || '',
        contactEmail: tenant.contactEmail || '',
        contactPhone: tenant.contactPhone || '',
        address: tenant.address || '',
        taxRate: tenant.taxRate ?? 5.0,
        acceptOrders: tenant.settings?.acceptOrders ?? true,
        autoAssignSalesman: tenant.settings?.autoAssignSalesman ?? false,
      });

      setIntegrationsForm({
        whatsappPhoneNumberId: tenant.settings?.whatsappPhoneNumberId || '',
        whatsappAccessToken: tenant.settings?.whatsappAccessToken || '',
        razorpayKeyId: tenant.settings?.razorpayKeyId || '',
      });
    }
  }, [tenant]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateTenant({
        tenantId,
        updates: {
          name: profileForm.name,
          contactEmail: profileForm.contactEmail,
          contactPhone: profileForm.contactPhone,
          address: profileForm.address,
          taxRate: Number(profileForm.taxRate),
          settings: {
            ...tenant?.settings,
            acceptOrders: profileForm.acceptOrders,
            autoAssignSalesman: profileForm.autoAssignSalesman,
          },
        },
      });
      showSuccess('Business profile and operational settings saved!');
    } catch (err) {
      showError(err.message || 'Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateTenant({
        tenantId,
        updates: {
          settings: {
            ...tenant?.settings,
            whatsappPhoneNumberId: integrationsForm.whatsappPhoneNumberId,
            whatsappAccessToken: integrationsForm.whatsappAccessToken,
            razorpayKeyId: integrationsForm.razorpayKeyId,
          },
        },
      });
      showSuccess('Integration credentials updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const orderUrl = `${window.location.origin}/order/${tenantId}?locationType=${qrType.toLowerCase()}&location=${encodeURIComponent(qrIdentifier)}`;

  const handlePrintQR = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${tenant?.name || 'Order Menu'}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h2 { margin-bottom: 5px; }
            p { color: #666; margin-top: 0; }
            .qr-box { margin: 30px auto; display: inline-block; padding: 20px; border: 2px dashed #333; border-radius: 12px; }
            .footer { font-weight: bold; font-size: 1.2rem; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h2>${tenant?.name || 'Order Food & Drinks'}</h2>
          <p>Scan with WhatsApp or camera to order directly from your ${qrType.toLowerCase()}</p>
          <div class="qr-box">
            ${document.getElementById('generated-qr-svg')?.outerHTML || ''}
            <div class="footer">${qrType}: ${qrIdentifier}</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Settings & Configuration"
        description="Configure your business identity, order dispatch policies, payment gateways, and generate QR ordering codes."
      />

      {/* Tabs */}
      <div className="card mb-6" style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'PROFILE' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('PROFILE')}
          >
            🏢 Business Profile & Operations
          </button>
          <button
            className={`btn ${activeTab === 'QR' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('QR')}
          >
            📱 Table & Seat QR Generator
          </button>
          <button
            className={`btn ${activeTab === 'INTEGRATIONS' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('INTEGRATIONS')}
          >
            ⚡ WhatsApp & Payment Gateway
          </button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} style={{ maxWidth: '700px' }}>
          <div className="card mb-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Business Identity</h3>

            <div className="form-group">
              <label className="form-label">Business / Brand Name *</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <textarea
                className="form-control"
                rows="2"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              />
            </div>
          </div>

          <div className="card mb-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Ordering Policies</h3>

            <div className="form-group">
              <label className="form-label">GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={profileForm.taxRate}
                onChange={(e) => setProfileForm({ ...profileForm, taxRate: e.target.value })}
                style={{ maxWidth: '180px' }}
              />
              <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                Applied automatically to all incoming order subtotals.
              </small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Accept Customer Orders</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  When switched off, ordering catalog displays a "Temporarily Closed" notice.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profileForm.acceptOrders}
                onChange={(e) => setProfileForm({ ...profileForm, acceptOrders: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong>Auto-Assign Salesman on Ready</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Automatically round-robin assign available salesmen when orders become ready.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profileForm.autoAssignSalesman}
                onChange={(e) => setProfileForm({ ...profileForm, autoAssignSalesman: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </form>
      )}

      {activeTab === 'QR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 360px', gap: '2rem', alignItems: 'start' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>QR Code Settings</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Generate custom QR codes for individual cinema seats, restaurant dining tables, or pickup counters.
            </p>

            <div className="form-group">
              <label className="form-label">Ordering Location Type</label>
              <select className="form-control" value={qrType} onChange={(e) => setQrType(e.target.value)}>
                <option value="SEAT">Theater Seat (e.g. Screen 1 - Row A, Seat 12)</option>
                <option value="TABLE">Restaurant Dining Table (e.g. Table 7)</option>
                <option value="COUNTER">Food Counter (Counter #1)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Seat / Table Identifier</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Screen 1 - A12 or Table 5"
                value={qrIdentifier}
                onChange={(e) => setQrIdentifier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Generated Destination URL</label>
              <input
                type="text"
                className="form-control"
                readOnly
                value={orderUrl}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handlePrintQR}>
                🖨️ Print QR Card
              </button>
            </div>
          </div>

          {/* QR Preview Card */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{tenant?.name || 'Our Venue'}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 1.5rem 0' }}>
              Scan to open the Menu
            </p>

            <div
              style={{
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                marginBottom: '1rem',
              }}
            >
              <QRCodeSVG
                id="generated-qr-svg"
                value={orderUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-400)' }}>
              {qrType}: {qrIdentifier}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'INTEGRATIONS' && (
        <form onSubmit={handleSaveIntegrations} style={{ maxWidth: '700px' }}>
          <div className="card mb-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Meta WhatsApp Business Cloud API</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Used for real-time order receipts, status push notifications, and marketing broadcasts.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Phone Number ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 108492048593021"
                value={integrationsForm.whatsappPhoneNumberId}
                onChange={(e) => setIntegrationsForm({ ...integrationsForm, whatsappPhoneNumberId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Permanent System User Access Token</label>
              <input
                type="password"
                className="form-control"
                placeholder="EAA..."
                value={integrationsForm.whatsappAccessToken}
                onChange={(e) => setIntegrationsForm({ ...integrationsForm, whatsappAccessToken: e.target.value })}
              />
            </div>
          </div>

          <div className="card mb-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Razorpay Payment Gateway</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Accept UPI, Cards, and Netbanking with automatic webhook reconciliation.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Razorpay Key ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="rzp_live_..."
                value={integrationsForm.razorpayKeyId}
                onChange={(e) => setIntegrationsForm({ ...integrationsForm, razorpayKeyId: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving Integrations...' : 'Save Integration Keys'}
          </button>
        </form>
      )}
    </div>
  );
}

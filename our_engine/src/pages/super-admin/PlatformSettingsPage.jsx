/* ============================================================
   SUPER ADMIN — PLATFORM SETTINGS
   Global SaaS configuration, security toggles, default fallbacks.
   ============================================================ */

import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { useToast } from '../../context/ToastContext';

export default function PlatformSettingsPage() {
  const { showSuccess } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showSuccess('Global platform parameters updated!');
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Platform Settings & Governance"
        description="Global SaaS policies, multi-tenant security configurations, and default service parameters."
      />

      <form onSubmit={handleSave} style={{ maxWidth: '650px' }}>
        <div className="card mb-6" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Global Platform Policy</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong>Tenant Self-Registration</strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Allow businesses to register trial accounts from public portal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: maintenanceMode ? 'var(--color-danger)' : 'inherit' }}>
                Emergency Maintenance Mode
              </strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Temporarily pauses customer checkout across all businesses for scheduled updates.
              </p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Platform Settings
        </button>
      </form>
    </div>
  );
}

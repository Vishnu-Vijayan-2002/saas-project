/* ============================================================
   SALESMAN PROFILE PAGE
   ============================================================ */

import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const { tenantName } = useTenant();

  const displayName = userProfile?.name || user?.displayName || 'Delivery Agent';
  const email = user?.email || '';
  const phone = userProfile?.phone || '';

  return (
    <>
      <PageHeader title="My Profile" />

      <div className="card animate-fade-in" style={{ maxWidth: 600 }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, hsl(200, 80%, 50%), hsl(260, 80%, 55%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3>{displayName}</h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Delivery Agent</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Business</label>
            <input className="form-input" value={tenantName} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={email} disabled />
          </div>
          {phone && (
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={phone} disabled />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value="Delivery Agent (Salesman)" disabled />
          </div>
        </div>
      </div>
    </>
  );
}

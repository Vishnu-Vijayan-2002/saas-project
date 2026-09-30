/* ============================================================
   TENANT CONTEXT — Tenant-scoped data and configuration
   ============================================================ */

import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../app/firebase';
import { useAuth } from './AuthContext';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.tenantId) {
      setTenant(null);
      setTenantLoading(false);
      return;
    }

    setTenantLoading(true);
    setTenantError(null);

    // Real-time listener for tenant document
    const tenantRef = doc(db, 'tenants', user.tenantId);
    const unsubscribe = onSnapshot(
      tenantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setTenant({ id: snapshot.id, ...snapshot.data() });
        } else {
          setTenantError('Tenant not found');
          setTenant(null);
        }
        setTenantLoading(false);
      },
      (err) => {
        console.error('Error fetching tenant:', err);
        setTenantError('Failed to load business data');
        setTenantLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, user?.tenantId]);

  const value = {
    tenant,
    tenantId: user?.tenantId || null,
    tenantLoading,
    tenantError,
    tenantName: tenant?.businessName || tenant?.name || 'Business',
    tenantType: tenant?.type || 'general',
    isActive: tenant?.status === 'ACTIVE',
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export default TenantContext;

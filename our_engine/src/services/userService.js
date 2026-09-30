/* ============================================================
   USER SERVICE — Tenant Staff & Salesmen Management
   ============================================================ */

import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../app/firebase';
import { createTenantUser } from './authService';

/**
 * Subscribe to users in a tenant.
 */
export function subscribeToTenantUsers(tenantId, callback, roleFilter = null) {
  if (!tenantId) return () => {};
  const usersRef = collection(db, 'tenants', tenantId, 'users');
  const constraints = [];

  if (roleFilter) {
    constraints.push(where('role', '==', roleFilter));
  }

  const q = query(usersRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(users);
    },
    (err) => {
      console.error('Error subscribing to tenant users:', err);
      callback([]);
    }
  );
}

/**
 * Create a new salesman for a tenant via Cloud Function.
 */
export async function createSalesmanUser(tenantId, { email, password, displayName, phone }) {
  return createTenantUser({
    tenantId,
    email,
    password,
    displayName,
    phone,
    role: 'SALESMAN',
  });
}

/**
 * Update user status (ACTIVE, SUSPENDED, INACTIVE).
 */
export async function updateUserStatus(tenantId, userId, status) {
  const userRef = doc(db, 'tenants', tenantId, 'users', userId);
  return updateDoc(userRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

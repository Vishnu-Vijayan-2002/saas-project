/* ============================================================
   CUSTOMER SERVICE — Customer directory and interaction history
   ============================================================ */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Subscribe to customers for a tenant.
 */
export function subscribeToCustomers(tenantId, callback, maxCount = 100) {
  if (!tenantId) return () => {};
  const customersRef = collection(db, 'tenants', tenantId, 'customers');
  const q = query(customersRef, orderBy('lastOrderAt', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const customers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(customers);
    },
    (err) => {
      console.error('Error subscribing to customers:', err);
      // Fallback query if lastOrderAt index is not ready
      const fallbackQ = query(customersRef, limit(maxCount));
      return onSnapshot(fallbackQ, (fallbackSnap) => {
        const customers = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(customers);
      });
    }
  );
}

/**
 * Get customer details by ID or phone.
 */
export async function getCustomer(tenantId, customerId) {
  const customerRef = doc(db, 'tenants', tenantId, 'customers', customerId);
  const snap = await getDoc(customerRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Upsert customer record when an order is placed.
 */
export async function upsertCustomer(tenantId, customerData) {
  const customerId = customerData.phone ? customerData.phone.replace(/\D/g, '') : doc(collection(db, 'tenants')).id;
  const customerRef = doc(db, 'tenants', tenantId, 'customers', customerId);

  return setDoc(
    customerRef,
    {
      ...customerData,
      phone: customerData.phone,
      name: customerData.name || 'Guest Customer',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

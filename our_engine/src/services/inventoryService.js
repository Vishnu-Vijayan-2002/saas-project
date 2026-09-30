/* ============================================================
   INVENTORY SERVICE — Stock level tracking and adjustments
   ============================================================ */

import {
  collection,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Update absolute stock quantity for a product.
 */
export async function updateStock(tenantId, productId, newStock, reason = 'MANUAL_COUNT') {
  const productRef = doc(db, 'tenants', tenantId, 'products', productId);

  // Update product stock
  await updateDoc(productRef, {
    stock: Number(newStock),
    inStock: Number(newStock) > 0,
    updatedAt: serverTimestamp(),
  });

  // Log inventory adjustment
  const logsRef = collection(db, 'tenants', tenantId, 'inventory_logs');
  return addDoc(logsRef, {
    productId,
    type: 'SET',
    newStock: Number(newStock),
    reason,
    timestamp: serverTimestamp(),
  });
}

/**
 * Adjust stock by delta (+/-).
 */
export async function adjustStock(tenantId, productId, delta, reason = 'ADJUSTMENT') {
  const productRef = doc(db, 'tenants', tenantId, 'products', productId);

  await updateDoc(productRef, {
    stock: increment(Number(delta)),
    updatedAt: serverTimestamp(),
  });

  const logsRef = collection(db, 'tenants', tenantId, 'inventory_logs');
  return addDoc(logsRef, {
    productId,
    type: 'DELTA',
    delta: Number(delta),
    reason,
    timestamp: serverTimestamp(),
  });
}

/**
 * Subscribe to inventory logs for audit trail.
 */
export function subscribeToInventoryLogs(tenantId, callback, maxCount = 50) {
  if (!tenantId) return () => {};
  const logsRef = collection(db, 'tenants', tenantId, 'inventory_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxCount));

  return onSnapshot(
    q,
    (snap) => {
      const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(logs);
    },
    (err) => {
      console.error('Error subscribing to inventory logs:', err);
      callback([]);
    }
  );
}

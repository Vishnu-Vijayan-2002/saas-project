/* ============================================================
   REFUND SERVICE — Refund operations via Cloud Functions
   ============================================================ */

import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../app/firebase';

/**
 * Create a refund via Cloud Function.
 * React NEVER directly marks a payment as refunded.
 * @param {object} params - { tenantId, orderId, amount, reason, idempotencyKey }
 */
export async function createRefund(params) {
  const fn = httpsCallable(functions, 'createRefund');
  return fn(params);
}

/**
 * Subscribe to refunds for a specific order.
 */
export function subscribeToRefunds(tenantId, orderId, callback) {
  const refundsRef = collection(db, 'tenants', tenantId, 'refunds');
  const q = query(
    refundsRef,
    where('orderId', '==', orderId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const refunds = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(refunds);
  });
}

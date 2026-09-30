/* ============================================================
   ORDER SERVICE — Order operations via Cloud Functions
   ============================================================ */

import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { db, functions } from '../app/firebase';

/**
 * Create an order via Cloud Function (NOT direct Firestore write).
 * @param {object} orderData - { tenantId, items, customer, idempotencyKey }
 */
export async function createOrder(orderData) {
  const fn = httpsCallable(functions, 'createOrder');
  return fn(orderData);
}

/**
 * Cancel an order via Cloud Function.
 * @param {object} params - { tenantId, orderId, reason, idempotencyKey }
 */
export async function cancelOrder(params) {
  const fn = httpsCallable(functions, 'cancelOrder');
  return fn(params);
}

/**
 * Update order status via Cloud Function (Business Admin only).
 * @param {object} params - { tenantId, orderId, newStatus }
 */
export async function updateOrderStatus(params) {
  const fn = httpsCallable(functions, 'updateOrderStatus');
  return fn(params);
}

/**
 * Assign salesman to order via Cloud Function.
 * @param {object} params - { tenantId, orderId, salesmanId }
 */
export async function assignSalesman(params) {
  const fn = httpsCallable(functions, 'assignSalesman');
  return fn(params);
}

/**
 * Get single order document.
 */
export async function getOrder(tenantId, orderId) {
  const orderRef = doc(db, 'tenants', tenantId, 'orders', orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Subscribe to real-time order updates.
 * @param {string} tenantId
 * @param {string} orderId
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function subscribeToOrder(tenantId, orderId, callback) {
  const orderRef = doc(db, 'tenants', tenantId, 'orders', orderId);
  return onSnapshot(orderRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to orders collection with filters.
 */
export function subscribeToOrders(tenantId, filters = {}, callback) {
  const ordersRef = collection(db, 'tenants', tenantId, 'orders');
  const constraints = [];

  if (filters.orderStatus) {
    constraints.push(where('orderStatus', '==', filters.orderStatus));
  }
  if (filters.paymentStatus) {
    constraints.push(where('paymentStatus', '==', filters.paymentStatus));
  }
  if (filters.assignedSalesmanId) {
    constraints.push(where('assignedSalesmanId', '==', filters.assignedSalesmanId));
  }
  if (filters.customerId) {
    constraints.push(where('customerId', '==', filters.customerId));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(filters.limit || 50));

  const q = query(ordersRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

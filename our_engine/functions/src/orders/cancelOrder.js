/* ============================================================
   CANCEL ORDER — Cloud Function
   Validates cancellation rules, initiates refund if paid.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireTenant } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');
const { canCancelOrder, ORDER_STATES, PAYMENT_STATES } = require('../utils/stateMachine');

const db = getFirestore();

exports.cancelOrder = onCall(async (request) => {
  const user = await verifyAuth(request);

  const { tenantId, orderId, reason, idempotencyKey } = request.data;

  if (!tenantId || !orderId) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  requireTenant(user, tenantId);

  const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const order = orderSnap.data();

  // Check permissions
  if (user.role === 'CUSTOMER' && order.customerId !== user.uid) {
    throw new HttpsError('permission-denied', 'You can only cancel your own orders.');
  }
  if (user.role === 'SALESMAN') {
    throw new HttpsError('permission-denied', 'Salesmen cannot cancel orders.');
  }

  // Validate cancellation
  const cancellation = canCancelOrder(order);
  if (!cancellation.allowed) {
    throw new HttpsError('failed-precondition', cancellation.reason);
  }

  const previousStatus = order.orderStatus;

  // Cancel the order
  const updates = {
    orderStatus: ORDER_STATES.CANCELLED,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await orderRef.update(updates);

  // Restore inventory
  if (order.items && order.items.length > 0) {
    const batch = db.batch();
    for (const item of order.items) {
      const productRef = db.collection('tenants').doc(tenantId).collection('products').doc(item.productId);
      batch.update(productRef, {
        stock: FieldValue.increment(item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  // Create cancellation audit record
  await createAuditLog({
    tenantId,
    actorUid: user.uid,
    actorRole: user.role,
    action: 'ORDER_CANCELLED',
    entityType: 'ORDER',
    entityId: orderId,
    previousState: previousStatus,
    newState: ORDER_STATES.CANCELLED,
    reason: reason || 'CUSTOMER_REQUEST',
  });

  // If payment was PAID, initiate refund (handled separately)
  const needsRefund = order.paymentStatus === PAYMENT_STATES.PAID;

  return {
    success: true,
    cancelled: true,
    needsRefund,
    message: needsRefund
      ? 'Order cancelled. Refund will be processed.'
      : 'Order cancelled successfully.',
  };
});

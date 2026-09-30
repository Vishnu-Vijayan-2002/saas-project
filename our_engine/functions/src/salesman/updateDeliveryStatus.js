/* ============================================================
   UPDATE DELIVERY STATUS — Cloud Function
   Salesman marks order as DELIVERED or records NOT_DELIVERED attempt.
   Enforces all 5 eligibility conditions.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireRole, requireTenant } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');
const { isEligibleForSalesmanDelivery, DELIVERY_STATES } = require('../utils/stateMachine');

const db = getFirestore();

exports.updateDeliveryStatus = onCall(async (request) => {
  const user = await verifyAuth(request);
  requireRole(user, ['SALESMAN']);

  const { tenantId, orderId, deliveryStatus, reason } = request.data;

  if (!tenantId || !orderId || !deliveryStatus) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  requireTenant(user, tenantId);

  // Only allow DELIVERED or NOT_DELIVERED
  if (![DELIVERY_STATES.DELIVERED, DELIVERY_STATES.NOT_DELIVERED].includes(deliveryStatus)) {
    throw new HttpsError('invalid-argument', 'Invalid delivery status.');
  }

  const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const order = orderSnap.data();

  // Verify ALL 5 conditions
  if (!isEligibleForSalesmanDelivery(order, { uid: user.uid, tenantId: user.tenantId })) {
    throw new HttpsError(
      'failed-precondition',
      'Order is not eligible for delivery update. Check assignment, payment, and order status.'
    );
  }

  if (deliveryStatus === DELIVERY_STATES.DELIVERED) {
    await orderRef.update({
      deliveryStatus: DELIVERY_STATES.DELIVERED,
      deliveredAt: FieldValue.serverTimestamp(),
      deliveredBy: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await createAuditLog({
      tenantId,
      actorUid: user.uid,
      actorRole: 'SALESMAN',
      action: 'ORDER_DELIVERED',
      entityType: 'ORDER',
      entityId: orderId,
      previousState: DELIVERY_STATES.NOT_DELIVERED,
      newState: DELIVERY_STATES.DELIVERED,
    });

    return { success: true, delivered: true };
  }

  // NOT_DELIVERED — record attempt
  if (!reason) {
    throw new HttpsError('invalid-argument', 'Reason is required for not-delivered status.');
  }

  await orderRef.update({
    lastDeliveryAttempt: {
      attemptedBy: user.uid,
      attemptedAt: FieldValue.serverTimestamp(),
      reason,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  await createAuditLog({
    tenantId,
    actorUid: user.uid,
    actorRole: 'SALESMAN',
    action: 'DELIVERY_ATTEMPTED',
    entityType: 'ORDER',
    entityId: orderId,
    metadata: { reason },
  });

  return { success: true, delivered: false, attemptRecorded: true };
});

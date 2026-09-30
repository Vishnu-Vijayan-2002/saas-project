/* ============================================================
   UPDATE ORDER STATUS — Cloud Function
   Business Admin transitions order through lifecycle.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireRole, requireTenant } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');
const { validateOrderTransition, ORDER_STATES } = require('../utils/stateMachine');

const db = getFirestore();

exports.updateOrderStatus = onCall(async (request) => {
  const user = await verifyAuth(request);
  requireRole(user, ['BUSINESS_ADMIN', 'SUPER_ADMIN']);

  const { tenantId, orderId, newStatus } = request.data;

  if (!tenantId || !orderId || !newStatus) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  requireTenant(user, tenantId);

  const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const order = orderSnap.data();
  const previousStatus = order.orderStatus;

  // Validate transition
  validateOrderTransition(previousStatus, newStatus);

  // Build update
  const updates = {
    orderStatus: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Set specific timestamps
  if (newStatus === ORDER_STATES.READY_FOR_DELIVERY) {
    updates.readyAt = FieldValue.serverTimestamp();
  }
  if (newStatus === ORDER_STATES.COMPLETED) {
    // Only complete if delivered
    if (order.deliveryStatus !== 'DELIVERED') {
      // Auto-set delivery to delivered when completing
      updates.deliveryStatus = 'DELIVERED';
      updates.deliveredAt = FieldValue.serverTimestamp();
    }
  }

  await orderRef.update(updates);

  // Audit log
  const actionMap = {
    [ORDER_STATES.CONFIRMED]: 'ORDER_CONFIRMED',
    [ORDER_STATES.PREPARING]: 'ORDER_PREPARING',
    [ORDER_STATES.READY_FOR_DELIVERY]: 'ORDER_READY',
    [ORDER_STATES.COMPLETED]: 'ORDER_COMPLETED',
  };

  await createAuditLog({
    tenantId,
    actorUid: user.uid,
    actorRole: user.role,
    action: actionMap[newStatus] || 'ORDER_STATUS_CHANGED',
    entityType: 'ORDER',
    entityId: orderId,
    previousState: previousStatus,
    newState: newStatus,
  });

  return { success: true, newStatus };
});

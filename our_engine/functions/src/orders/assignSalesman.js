/* ============================================================
   ASSIGN SALESMAN — Cloud Function
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireRole, requireTenant } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');

const db = getFirestore();

exports.assignSalesman = onCall(async (request) => {
  const user = await verifyAuth(request);
  requireRole(user, ['BUSINESS_ADMIN', 'SUPER_ADMIN']);

  const { tenantId, orderId, salesmanId } = request.data;

  if (!tenantId || !orderId || !salesmanId) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  requireTenant(user, tenantId);

  // Verify salesman exists and belongs to this tenant
  const salesmanRef = db.collection('tenants').doc(tenantId).collection('users').doc(salesmanId);
  const salesmanSnap = await salesmanRef.get();

  if (!salesmanSnap.exists || salesmanSnap.data().role !== 'SALESMAN') {
    throw new HttpsError('not-found', 'Salesman not found in this business.');
  }

  // Update order
  const orderRef = db.collection('tenants').doc(tenantId).collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError('not-found', 'Order not found.');
  }

  const previousSalesman = orderSnap.data().assignedSalesmanId;

  await orderRef.update({
    assignedSalesmanId: salesmanId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await createAuditLog({
    tenantId,
    actorUid: user.uid,
    actorRole: user.role,
    action: 'SALESMAN_ASSIGNED',
    entityType: 'ORDER',
    entityId: orderId,
    metadata: { salesmanId, previousSalesman },
  });

  return { success: true };
});

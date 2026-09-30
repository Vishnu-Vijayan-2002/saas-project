/* ============================================================
   UPDATE TENANT — Cloud Function
   Update tenant settings, profile, or status.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { verifyAuth, requireTenant } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');

const db = getFirestore();

exports.updateTenant = onCall({ cors: true }, async (request) => {
  const caller = await verifyAuth(request);

  const { tenantId, updates = {} } = request.data || {};

  if (!tenantId) {
    throw new HttpsError('invalid-argument', 'Missing tenantId.');
  }

  // Check authorization
  requireTenant(caller, tenantId);

  const tenantRef = db.collection('tenants').doc(tenantId);
  const tenantSnap = await tenantRef.get();
  if (!tenantSnap.exists) {
    throw new HttpsError('not-found', `Tenant ${tenantId} not found.`);
  }

  const existingData = tenantSnap.data();
  const safeUpdates = {};

  // Fields business admin and super admin can modify
  const allowedFields = [
    'name',
    'businessName',
    'contactEmail',
    'contactPhone',
    'address',
    'taxRate',
    'logoUrl',
    'settings',
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  });

  // Only SUPER_ADMIN can alter tenant status or subscription tier
  if (updates.status !== undefined) {
    if (caller.role !== 'SUPER_ADMIN') {
      throw new HttpsError('permission-denied', 'Only Super Admin can change tenant status.');
    }
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!validStatuses.includes(updates.status)) {
      throw new HttpsError('invalid-argument', `Invalid status: ${updates.status}`);
    }
    safeUpdates.status = updates.status;
  }

  safeUpdates.updatedAt = FieldValue.serverTimestamp();

  await tenantRef.update(safeUpdates);

  await createAuditLog({
    tenantId,
    action: 'TENANT_UPDATED',
    actorId: caller.uid,
    actorRole: caller.role,
    resourceType: 'tenants',
    resourceId: tenantId,
    details: safeUpdates,
  });

  return {
    success: true,
    tenantId,
    updatedFields: Object.keys(safeUpdates),
  };
});

/* ============================================================
   CLOUD FUNCTIONS — Audit log utility
   Records all sensitive actions.
   ============================================================ */

const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * Create an audit log entry.
 * @param {object} params
 * @param {string} params.tenantId
 * @param {string} params.actorUid
 * @param {string} params.actorRole
 * @param {string} params.action - e.g., ORDER_CREATED, REFUND_COMPLETED
 * @param {string} params.entityType - e.g., ORDER, PAYMENT
 * @param {string} params.entityId
 * @param {object} params.metadata - Additional context
 * @param {string} params.previousState - State before the action
 * @param {string} params.newState - State after the action
 * @param {string} params.reason - Why the action was taken
 */
async function createAuditLog({
  tenantId,
  actorUid,
  actorRole,
  action,
  entityType,
  entityId,
  metadata = {},
  previousState,
  newState,
  reason,
}) {
  try {
    const auditRef = db.collection('tenants').doc(tenantId).collection('auditLogs');
    await auditRef.add({
      tenantId,
      actorUid,
      actorRole,
      action,
      entityType,
      entityId,
      metadata,
      previousState: previousState || null,
      newState: newState || null,
      reason: reason || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Audit log creation should not fail the main operation
    console.error('Failed to create audit log:', err);
  }
}

module.exports = { createAuditLog };

/* ============================================================
   CLOUD FUNCTIONS — Idempotency utility
   Prevents duplicate operations using Firestore-backed keys.
   ============================================================ */

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');

const db = getFirestore();

/**
 * Check idempotency key. If already processed, throw ALREADY_EXISTS.
 * If not processed, create the key and return.
 * @param {string} key - Unique idempotency key
 * @param {string} operation - Operation type (e.g., 'CREATE_ORDER', 'CREATE_REFUND')
 * @param {object} metadata - Additional metadata to store
 */
async function checkIdempotency(key, operation, metadata = {}) {
  if (!key) {
    throw new HttpsError('invalid-argument', 'Idempotency key is required.');
  }

  const keyRef = db.collection('idempotencyKeys').doc(key);

  try {
    await db.runTransaction(async (transaction) => {
      const keyDoc = await transaction.get(keyRef);

      if (keyDoc.exists) {
        const data = keyDoc.data();
        throw new HttpsError(
          'already-exists',
          `Duplicate request. This ${operation} has already been processed.`,
          { existingResult: data.result || null }
        );
      }

      transaction.set(keyRef, {
        key,
        operation,
        metadata,
        status: 'PROCESSING',
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Idempotency check failed.');
  }
}

/**
 * Mark an idempotency key as completed with result.
 */
async function completeIdempotency(key, result) {
  const keyRef = db.collection('idempotencyKeys').doc(key);
  await keyRef.update({
    status: 'COMPLETED',
    result,
    completedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Mark an idempotency key as failed, allowing retry.
 */
async function failIdempotency(key, error) {
  const keyRef = db.collection('idempotencyKeys').doc(key);
  await keyRef.update({
    status: 'FAILED',
    error: error?.message || 'Unknown error',
    failedAt: FieldValue.serverTimestamp(),
  });
}

module.exports = {
  checkIdempotency,
  completeIdempotency,
  failIdempotency,
};

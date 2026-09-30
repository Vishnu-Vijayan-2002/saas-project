/* ============================================================
   CLOUD FUNCTIONS — Auth utilities
   Verify tokens, extract claims, check permissions.
   ============================================================ */

const { getAuth } = require('firebase-admin/auth');
const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Verify that the request is authenticated and return user data.
 * @param {object} request - Cloud Function request
 * @returns {{ uid: string, email: string, role: string, tenantId: string }}
 */
async function verifyAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const { uid, token } = request.auth;
  const role = token.role || null;
  const tenantId = token.tenantId || null;

  return { uid, email: token.email, role, tenantId };
}

/**
 * Verify that the user has a specific role.
 */
function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    throw new HttpsError('permission-denied', 'You do not have permission for this action.');
  }
}

/**
 * Verify that the user belongs to the specified tenant.
 */
function requireTenant(user, tenantId) {
  if (user.role === 'SUPER_ADMIN') return; // Super Admin can access any tenant
  if (user.tenantId !== tenantId) {
    throw new HttpsError('permission-denied', 'Tenant access denied.');
  }
}

/**
 * Set custom claims on a user (role + tenantId).
 */
async function setUserClaims(uid, claims) {
  await getAuth().setCustomUserClaims(uid, claims);
}

/**
 * Get user by UID.
 */
async function getUserById(uid) {
  return getAuth().getUser(uid);
}

/**
 * Create a Firebase Auth user.
 */
async function createAuthUser(email, password, displayName) {
  return getAuth().createUser({
    email,
    password,
    displayName,
    emailVerified: false,
  });
}

module.exports = {
  verifyAuth,
  requireRole,
  requireTenant,
  setUserClaims,
  getUserById,
  createAuthUser,
};

/* ============================================================
   USER FUNCTIONS — Auth & User Management Cloud Functions
   Handles user creation with custom claims (role, tenantId).
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { verifyAuth, requireRole, setUserClaims } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');

const db = getFirestore();

/**
 * createTenantUser
 * Creates a new user in Firebase Auth with assigned custom claims (role, tenantId)
 * and records their profile in Firestore.
 */
exports.createTenantUser = onCall(async (request) => {
  const caller = await verifyAuth(request);

  const { email, password, displayName, role, tenantId, phone } = request.data || {};

  if (!email || !password || !role || !tenantId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: email, password, role, tenantId');
  }

  // Validate password strength
  if (typeof password !== 'string' || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters long.');
  }

  // Role permissions:
  // SUPER_ADMIN can create any role (BUSINESS_ADMIN, SALESMAN) for any tenant
  // BUSINESS_ADMIN can only create SALESMAN for their own tenant
  if (caller.role === 'SUPER_ADMIN') {
    if (!['BUSINESS_ADMIN', 'SALESMAN'].includes(role)) {
      throw new HttpsError('invalid-argument', `Invalid role: ${role}`);
    }
  } else if (caller.role === 'BUSINESS_ADMIN') {
    if (role !== 'SALESMAN') {
      throw new HttpsError('permission-denied', 'Business Admin can only create Salesman users.');
    }
    if (caller.tenantId !== tenantId) {
      throw new HttpsError('permission-denied', 'Cannot create users for a different tenant.');
    }
  } else {
    throw new HttpsError('permission-denied', 'Insufficient permissions to create tenant users.');
  }

  // Verify tenant exists
  const tenantRef = db.collection('tenants').doc(tenantId);
  const tenantSnap = await tenantRef.get();
  if (!tenantSnap.exists) {
    throw new HttpsError('not-found', `Tenant ${tenantId} does not exist.`);
  }

  try {
    // 1. Create Firebase Auth user
    const createParams = {
      email,
      password,
      displayName: displayName || email.split('@')[0],
    };
    if (phone) {
      createParams.phoneNumber = phone;
    }

    const authUser = await getAuth().createUser(createParams);

    // 2. Set custom claims
    await setUserClaims(authUser.uid, {
      role,
      tenantId,
    });

    // 3. Create user doc in tenant subcollection and global collection
    const userDocData = {
      uid: authUser.uid,
      email,
      displayName: createParams.displayName,
      phone: phone || null,
      role,
      tenantId,
      status: 'ACTIVE',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    };

    const batch = db.batch();
    batch.set(db.collection('tenants').doc(tenantId).collection('users').doc(authUser.uid), userDocData);
    batch.set(db.collection('users').doc(authUser.uid), userDocData);
    await batch.commit();

    // 4. Audit log
    await createAuditLog({
      tenantId,
      action: 'USER_CREATED',
      actorId: caller.uid,
      actorRole: caller.role,
      resourceType: 'users',
      resourceId: authUser.uid,
      details: {
        email,
        role,
        displayName: createParams.displayName,
      },
    });

    return {
      success: true,
      uid: authUser.uid,
      email: authUser.email,
      role,
      tenantId,
    };
  } catch (error) {
    console.error('Error creating tenant user:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Failed to create user');
  }
});

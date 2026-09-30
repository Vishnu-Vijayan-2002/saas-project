/* ============================================================
   CREATE TENANT — Cloud Function
   Super Admin creates a new tenant organization and initial config.
   ============================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { verifyAuth, requireRole, setUserClaims } = require('../utils/auth');
const { createAuditLog } = require('../utils/audit');
const { v4: uuidv4 } = require('uuid');

const db = getFirestore();

exports.createTenant = onCall({ cors: true }, async (request) => {
  const caller = await verifyAuth(request);
  requireRole(caller, ['SUPER_ADMIN']);

  const {
    name,
    businessName,
    type = 'OTHER',
    contactEmail,
    contactPhone,
    address = '',
    currency = 'INR',
    taxRate = 5.0,
    adminEmail,
    adminPassword,
    adminName,
    settings = {},
  } = request.data || {};

  const tenantName = businessName || name;
  if (!tenantName) {
    throw new HttpsError('invalid-argument', 'Business name is required.');
  }

  const validTypes = ['THEATER', 'RESTAURANT', 'FOOD_COUNTER', 'OTHER'];
  if (!validTypes.includes(type)) {
    throw new HttpsError('invalid-argument', `Invalid business type: ${type}. Allowed: ${validTypes.join(', ')}`);
  }

  try {
    const tenantRef = db.collection('tenants').doc();
    const tenantId = tenantRef.id;

    const tenantData = {
      id: tenantId,
      name: tenantName,
      businessName: tenantName,
      type,
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      address,
      currency,
      taxRate: Number(taxRate) || 0,
      status: 'ACTIVE',
      logoUrl: '',
      settings: {
        acceptOrders: true,
        whatsappNotifications: true,
        autoAssignSalesman: false,
        paymentGateway: 'RAZORPAY',
        ...settings,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: caller.uid,
    };

    await tenantRef.set(tenantData);

    let createdAdmin = null;

    // Optional: Provision initial Business Admin account
    if (adminEmail && adminPassword) {
      if (adminPassword.length < 6) {
        throw new HttpsError('invalid-argument', 'Admin password must be at least 6 characters.');
      }

      const authUser = await getAuth().createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName || `${tenantName} Admin`,
      });

      await setUserClaims(authUser.uid, {
        role: 'BUSINESS_ADMIN',
        tenantId,
      });

      const adminDocData = {
        uid: authUser.uid,
        email: adminEmail,
        displayName: adminName || `${tenantName} Admin`,
        role: 'BUSINESS_ADMIN',
        tenantId,
        status: 'ACTIVE',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: caller.uid,
      };

      const batch = db.batch();
      batch.set(db.collection('tenants').doc(tenantId).collection('users').doc(authUser.uid), adminDocData);
      batch.set(db.collection('users').doc(authUser.uid), adminDocData);
      await batch.commit();

      createdAdmin = {
        uid: authUser.uid,
        email: adminEmail,
      };
    }

    await createAuditLog({
      tenantId,
      action: 'TENANT_CREATED',
      actorId: caller.uid,
      actorRole: caller.role,
      resourceType: 'tenants',
      resourceId: tenantId,
      details: {
        name: tenantName,
        type,
        createdAdminEmail: adminEmail || null,
      },
    });

    return {
      success: true,
      tenantId,
      tenant: tenantData,
      admin: createdAdmin,
    };
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Failed to create tenant organization.');
  }
});

/* ============================================================
   TENANT SERVICE — Tenant management
   Attempts Cloud Function with intelligent Firestore fallback
   for local development when functions are not yet deployed.
   ============================================================ */

import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from '../app/firebase';

/**
 * Create a new tenant (Super Admin).
 * Tries Cloud Function first, falls back to direct Firestore creation if functions aren't deployed.
 */
export async function createTenant(tenantData) {
  try {
    const fn = httpsCallable(functions, 'createTenant');
    return await fn(tenantData);
  } catch (err) {
    console.warn('Cloud Function createTenant unavailable, writing directly to Firestore:', err.message);
    const tenantRef = doc(collection(db, 'tenants'));
    const tenantId = tenantRef.id;

    const dataToSave = {
      id: tenantId,
      name: tenantData.businessName || tenantData.name,
      businessName: tenantData.businessName || tenantData.name,
      type: tenantData.type || 'OTHER',
      contactEmail: tenantData.contactEmail || '',
      contactPhone: tenantData.contactPhone || '',
      address: tenantData.address || '',
      taxRate: Number(tenantData.taxRate) || 5.0,
      currency: tenantData.currency || 'INR',
      status: 'ACTIVE',
      logoUrl: '',
      settings: {
        acceptOrders: true,
        whatsappNotifications: true,
        autoAssignSalesman: false,
        paymentGateway: 'RAZORPAY',
        ...tenantData.settings,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(tenantRef, dataToSave);
    return { data: { success: true, tenantId, tenant: dataToSave } };
  }
}

/**
 * Update tenant configuration.
 */
export async function updateTenant(params) {
  try {
    const fn = httpsCallable(functions, 'updateTenant');
    return await fn(params);
  } catch (err) {
    console.warn('Cloud Function updateTenant unavailable, updating directly in Firestore:', err.message);
    const tenantRef = doc(db, 'tenants', params.tenantId);
    await updateDoc(tenantRef, {
      ...params.updates,
      updatedAt: serverTimestamp(),
    });
    return { data: { success: true } };
  }
}

/**
 * Get a single tenant.
 */
export async function getTenant(tenantId) {
  const tenantRef = doc(db, 'tenants', tenantId);
  const snap = await getDoc(tenantRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Subscribe to all tenants (Super Admin).
 */
export function subscribeToTenants(callback) {
  const tenantsRef = collection(db, 'tenants');
  const q = query(tenantsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tenants = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(tenants);
  });
}

/**
 * Get tenant public info (for customer ordering page).
 */
export async function getTenantPublicInfo(tenantId) {
  const tenantRef = doc(db, 'tenants', tenantId);
  const snap = await getDoc(tenantRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.businessName || data.name,
    type: data.type,
    logo: data.logoUrl,
    status: data.status,
  };
}

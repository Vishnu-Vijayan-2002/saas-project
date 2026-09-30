/* ============================================================
   CAMPAIGN SERVICE — Campaigns & Movie Promotions
   ============================================================ */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../app/firebase';

/**
 * Subscribe to campaigns for a tenant.
 */
export function subscribeToCampaigns(tenantId, callback) {
  if (!tenantId) return () => {};
  const campaignsRef = collection(db, 'tenants', tenantId, 'campaigns');
  const q = query(campaignsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const campaigns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(campaigns);
    },
    (err) => {
      console.error('Error subscribing to campaigns:', err);
      callback([]);
    }
  );
}

/**
 * Create a new campaign (draft).
 */
export async function createCampaign(tenantId, campaignData) {
  const campaignsRef = collection(db, 'tenants', tenantId, 'campaigns');
  return addDoc(campaignsRef, {
    ...campaignData,
    tenantId,
    status: 'DRAFT',
    sentCount: 0,
    failedCount: 0,
    totalRecipients: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update an existing campaign.
 */
export async function updateCampaign(tenantId, campaignId, updates) {
  const campaignRef = doc(db, 'tenants', tenantId, 'campaigns', campaignId);
  return updateDoc(campaignRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Trigger campaign execution via Cloud Function.
 */
export async function triggerCampaignExecution(tenantId, campaignId) {
  const fn = httpsCallable(functions, 'executeCampaign');
  return fn({ tenantId, campaignId });
}

/**
 * Subscribe to movie promotions.
 */
export function subscribeToMoviePromotions(tenantId, callback) {
  if (!tenantId) return () => {};
  const promosRef = collection(db, 'tenants', tenantId, 'moviePromotions');
  const q = query(promosRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const promos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(promos);
    },
    (err) => {
      console.error('Error subscribing to movie promotions:', err);
      callback([]);
    }
  );
}

/**
 * Create movie promotion.
 */
export async function createMoviePromotion(tenantId, data) {
  const promosRef = collection(db, 'tenants', tenantId, 'moviePromotions');
  return addDoc(promosRef, {
    ...data,
    tenantId,
    status: data.status || 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update movie promotion.
 */
export async function updateMoviePromotion(tenantId, promoId, updates) {
  const promoRef = doc(db, 'tenants', tenantId, 'moviePromotions', promoId);
  return updateDoc(promoRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete movie promotion.
 */
export async function deleteMoviePromotion(tenantId, promoId) {
  const promoRef = doc(db, 'tenants', tenantId, 'moviePromotions', promoId);
  return deleteDoc(promoRef);
}

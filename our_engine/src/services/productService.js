/* ============================================================
   PRODUCT SERVICE — Product CRUD (Firestore direct for reads,
   writes allowed for Business Admin via security rules)
   ============================================================ */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../app/firebase';

/**
 * Subscribe to products for a tenant.
 */
export function subscribeToProducts(tenantId, callback, filters = {}) {
  const productsRef = collection(db, 'tenants', tenantId, 'products');
  const constraints = [];

  if (filters.categoryId) {
    constraints.push(where('categoryId', '==', filters.categoryId));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('name', 'asc'));

  const q = query(productsRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}

/**
 * Create a product.
 */
export async function createProduct(tenantId, productData) {
  const productsRef = collection(db, 'tenants', tenantId, 'products');
  return addDoc(productsRef, {
    ...productData,
    tenantId,
    status: productData.status || 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update a product.
 */
export async function updateProduct(tenantId, productId, updates) {
  const productRef = doc(db, 'tenants', tenantId, 'products', productId);
  return updateDoc(productRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Upload product image.
 */
export async function uploadProductImage(tenantId, productId, file) {
  const imageRef = ref(storage, `tenants/${tenantId}/products/${productId}_${Date.now()}`);
  const snapshot = await uploadBytes(imageRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Delete (deactivate) a product.
 */
export async function deactivateProduct(tenantId, productId) {
  const productRef = doc(db, 'tenants', tenantId, 'products', productId);
  return updateDoc(productRef, {
    status: 'INACTIVE',
    updatedAt: serverTimestamp(),
  });
}

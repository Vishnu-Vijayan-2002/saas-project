/* ============================================================
   CATEGORY SERVICE — Category management for tenants
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
import { db } from '../app/firebase';

/**
 * Subscribe to categories for a tenant.
 */
export function subscribeToCategories(tenantId, callback) {
  if (!tenantId) return () => {};
  const categoriesRef = collection(db, 'tenants', tenantId, 'categories');
  const q = query(categoriesRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(categories);
    },
    (error) => {
      console.error('Error subscribing to categories:', error);
      callback([]);
    }
  );
}

/**
 * Create a new category.
 */
export async function createCategory(tenantId, data) {
  const categoriesRef = collection(db, 'tenants', tenantId, 'categories');
  return addDoc(categoriesRef, {
    name: data.name.trim(),
    description: data.description || '',
    icon: data.icon || 'tag',
    color: data.color || '#3b82f6',
    sortOrder: Number(data.sortOrder) || 0,
    status: data.status || 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update an existing category.
 */
export async function updateCategory(tenantId, categoryId, updates) {
  const categoryRef = doc(db, 'tenants', tenantId, 'categories', categoryId);
  return updateDoc(categoryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a category.
 */
export async function deleteCategory(tenantId, categoryId) {
  const categoryRef = doc(db, 'tenants', tenantId, 'categories', categoryId);
  return deleteDoc(categoryRef);
}

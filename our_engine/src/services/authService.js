/* ============================================================
   AUTH SERVICE — Firebase Authentication operations
   ============================================================ */

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../app/firebase';

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out.
 */
export async function logoutUser() {
  return signOut(auth);
}

/**
 * Send password reset email.
 */
export async function sendResetEmail(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Create a new user (called by Admin via Cloud Function).
 * This should go through a Cloud Function to set custom claims.
 */
export async function createTenantUser(userData) {
  const createUser = httpsCallable(functions, 'createTenantUser');
  return createUser(userData);
}

/**
 * Get the current user's ID token result with claims.
 */
export async function getCurrentUserClaims() {
  if (!auth.currentUser) return null;
  const tokenResult = await auth.currentUser.getIdTokenResult(true);
  return tokenResult.claims;
}

/**
 * Force refresh the current user's token.
 */
export async function refreshUserToken() {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(true);
}

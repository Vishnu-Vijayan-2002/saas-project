/* ============================================================
   AUTH CONTEXT — Firebase Authentication + Custom Claims
   ============================================================ */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../app/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null);
      if (firebaseUser) {
        try {
          // Force token refresh to get latest custom claims
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const claims = tokenResult.claims;

          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: claims.role || null,
            tenantId: claims.tenantId || null,
          };

          setUser(userData);

          // Fetch user profile from Firestore for additional data
          if (claims.tenantId) {
            const profileRef = doc(db, 'tenants', claims.tenantId, 'users', firebaseUser.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              setUserProfile({ id: profileSnap.id, ...profileSnap.data() });
            }
          } else if (claims.role === 'SUPER_ADMIN') {
            const profileRef = doc(db, 'userProfiles', firebaseUser.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              setUserProfile({ id: profileSnap.id, ...profileSnap.data() });
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data');
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const errorMap = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Invalid password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      const message = errorMap[err.code] || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  }, []);

  // Password reset
  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const message = err.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : 'Failed to send reset email. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Refresh token (to pick up new custom claims)
  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      const tokenResult = await auth.currentUser.getIdTokenResult(true);
      const claims = tokenResult.claims;
      setUser((prev) => ({
        ...prev,
        role: claims.role || prev?.role,
        tenantId: claims.tenantId || prev?.tenantId,
      }));
    }
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    login,
    logout,
    resetPassword,
    refreshToken,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isBusinessAdmin: user?.role === 'BUSINESS_ADMIN',
    isSalesman: user?.role === 'SALESMAN',
    isCustomer: user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

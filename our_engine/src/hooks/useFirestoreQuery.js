/* ============================================================
   useFirestoreQuery — Generic real-time Firestore listener
   ============================================================ */

import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Generic Firestore real-time subscription hook.
 * @param {import('firebase/firestore').Query|null} queryRef - Firestore query reference
 * @returns {{ data: Array, loading: boolean, error: string|null }}
 */
export function useFirestoreQuery(queryRef) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!queryRef) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(results);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore query error:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryRef]);

  return { data, loading, error };
}

/**
 * Generic Firestore single document subscription.
 * @param {import('firebase/firestore').DocumentReference|null} docRef - Document reference
 * @returns {{ data: object|null, loading: boolean, error: string|null, exists: boolean }}
 */
export function useFirestoreDoc(docRef) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      setExists(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() });
          setExists(true);
        } else {
          setData(null);
          setExists(false);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore doc error:', err);
        setError(err.message || 'Failed to load document');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error, exists };
}

export default useFirestoreQuery;

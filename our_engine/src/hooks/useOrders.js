/* ============================================================
   useOrders — Real-time order subscription hook
   ============================================================ */

import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../app/firebase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ROLES, PAYMENT_STATES, ORDER_STATES, DELIVERY_STATES } from '../utils/constants';

/**
 * Real-time orders hook with role-aware queries.
 * @param {object} options
 * @param {string} options.statusFilter - Order status filter
 * @param {string} options.paymentFilter - Payment status filter
 * @param {string} options.deliveryFilter - Delivery status filter
 * @param {number} options.limitCount - Max results
 * @returns {{ orders: Array, loading: boolean, error: string|null }}
 */
export function useOrders(options = {}) {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    statusFilter,
    paymentFilter,
    deliveryFilter,
    limitCount = 50,
  } = options;

  useEffect(() => {
    if (!user || !tenantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersRef = collection(db, 'tenants', tenantId, 'orders');
    const constraints = [];

    // Role-specific query constraints
    if (user.role === ROLES.SALESMAN) {
      // Salesman: only see assigned, paid, ready, not-delivered orders
      constraints.push(where('assignedSalesmanId', '==', user.uid));
      constraints.push(where('paymentStatus', '==', PAYMENT_STATES.PAID));
      constraints.push(where('orderStatus', '==', ORDER_STATES.READY_FOR_DELIVERY));
      constraints.push(where('deliveryStatus', '==', DELIVERY_STATES.NOT_DELIVERED));
    } else if (user.role === ROLES.CUSTOMER) {
      constraints.push(where('customerId', '==', user.uid));
    }

    // Additional filters (admin only)
    if (user.role === ROLES.BUSINESS_ADMIN || user.role === ROLES.SUPER_ADMIN) {
      if (statusFilter) {
        constraints.push(where('orderStatus', '==', statusFilter));
      }
      if (paymentFilter) {
        constraints.push(where('paymentStatus', '==', paymentFilter));
      }
      if (deliveryFilter) {
        constraints.push(where('deliveryStatus', '==', deliveryFilter));
      }
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));

    const q = query(ordersRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderList);
        setLoading(false);
      },
      (err) => {
        console.error('Orders subscription error:', err);
        setError('Failed to load orders');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, tenantId, statusFilter, paymentFilter, deliveryFilter, limitCount]);

  return { orders, loading, error };
}

/**
 * Real-time single order subscription.
 * @param {string} orderId
 * @returns {{ order: object|null, loading: boolean, error: string|null }}
 */
export function useOrder(orderId) {
  const { tenantId } = useTenant();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId || !orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const orderDocRef = doc(db, 'tenants', tenantId, 'orders', orderId);

    const unsubscribe = onSnapshot(
      orderDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          setError('Order not found');
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Order subscription error:', err);
        setError('Failed to load order');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, orderId]);

  return { order, loading, error };
}

/**
 * Salesman delivery history hook.
 * @returns {{ orders: Array, loading: boolean, error: string|null }}
 */
export function useSalesmanHistory() {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !tenantId || user.role !== ROLES.SALESMAN) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, 'tenants', tenantId, 'orders');
    const q = query(
      ordersRef,
      where('assignedSalesmanId', '==', user.uid),
      where('deliveryStatus', '==', DELIVERY_STATES.DELIVERED),
      orderBy('deliveredAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(orderList);
        setLoading(false);
      },
      (err) => {
        console.error('History subscription error:', err);
        setError('Failed to load delivery history');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, tenantId]);

  return { orders, loading, error };
}

export default useOrders;

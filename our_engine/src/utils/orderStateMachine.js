/* ============================================================
   ORDER STATE MACHINE
   Centralized validation for all state transitions.
   Used by both React frontend and Cloud Functions backend.
   ============================================================ */

import { ORDER_STATES, PAYMENT_STATES, DELIVERY_STATES } from './constants.js';

// ---- VALID ORDER STATUS TRANSITIONS ----
const ORDER_TRANSITIONS = {
  [ORDER_STATES.PENDING]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PREPARING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PREPARING]: [ORDER_STATES.READY_FOR_DELIVERY, ORDER_STATES.CANCELLED],
  [ORDER_STATES.READY_FOR_DELIVERY]: [ORDER_STATES.COMPLETED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CANCELLED]: [], // Terminal state
  [ORDER_STATES.COMPLETED]: [], // Terminal state
};

// ---- VALID PAYMENT STATUS TRANSITIONS ----
const PAYMENT_TRANSITIONS = {
  [PAYMENT_STATES.PENDING]: [PAYMENT_STATES.PAID, PAYMENT_STATES.FAILED],
  [PAYMENT_STATES.PAID]: [PAYMENT_STATES.PARTIALLY_REFUNDED, PAYMENT_STATES.REFUNDED],
  [PAYMENT_STATES.FAILED]: [PAYMENT_STATES.PAID], // Retry
  [PAYMENT_STATES.PARTIALLY_REFUNDED]: [PAYMENT_STATES.PARTIALLY_REFUNDED, PAYMENT_STATES.REFUNDED],
  [PAYMENT_STATES.REFUNDED]: [], // Terminal state
};

// ---- VALID DELIVERY STATUS TRANSITIONS ----
const DELIVERY_TRANSITIONS = {
  [DELIVERY_STATES.NOT_DELIVERED]: [DELIVERY_STATES.DELIVERED],
  [DELIVERY_STATES.DELIVERED]: [], // Terminal state
};

/**
 * Check if an order status transition is valid.
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Desired order status
 * @returns {boolean}
 */
export function canTransitionOrderStatus(currentStatus, newStatus) {
  const validTransitions = ORDER_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}

/**
 * Check if a payment status transition is valid.
 * @param {string} currentStatus - Current payment status
 * @param {string} newStatus - Desired payment status
 * @returns {boolean}
 */
export function canTransitionPaymentStatus(currentStatus, newStatus) {
  const validTransitions = PAYMENT_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}

/**
 * Check if a delivery status transition is valid.
 * @param {string} currentStatus - Current delivery status
 * @param {string} newStatus - Desired delivery status
 * @returns {boolean}
 */
export function canUpdateDeliveryStatus(currentStatus, newStatus) {
  const validTransitions = DELIVERY_TRANSITIONS[currentStatus];
  if (!validTransitions) return false;
  return validTransitions.includes(newStatus);
}

/**
 * Check if an order can be cancelled.
 * Rules:
 * - Cannot cancel a COMPLETED order
 * - Cannot cancel an already CANCELLED order
 * - Cannot cancel if delivery is DELIVERED
 * @param {object} order - Order document
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canCancelOrder(order) {
  if (!order) {
    return { allowed: false, reason: 'Order not found' };
  }
  if (order.orderStatus === ORDER_STATES.COMPLETED) {
    return { allowed: false, reason: 'Completed orders cannot be cancelled' };
  }
  if (order.orderStatus === ORDER_STATES.CANCELLED) {
    return { allowed: false, reason: 'Order is already cancelled' };
  }
  if (order.deliveryStatus === DELIVERY_STATES.DELIVERED) {
    return { allowed: false, reason: 'Delivered orders cannot be cancelled' };
  }
  return { allowed: true, reason: null };
}

/**
 * Check if an order is eligible for refund.
 * @param {object} order - Order document
 * @returns {{ allowed: boolean, reason: string|null, maxRefundAmount: number }}
 */
export function canRefundOrder(order) {
  if (!order) {
    return { allowed: false, reason: 'Order not found', maxRefundAmount: 0 };
  }

  const payment = order.payment || {};
  const paidAmount = payment.paidAmount || 0;
  const refundedAmount = payment.refundedAmount || 0;
  const remainingRefundable = paidAmount - refundedAmount;

  if (order.paymentStatus === PAYMENT_STATES.PENDING ||
      order.paymentStatus === PAYMENT_STATES.FAILED) {
    return { allowed: false, reason: 'Payment has not been completed', maxRefundAmount: 0 };
  }

  if (order.paymentStatus === PAYMENT_STATES.REFUNDED) {
    return { allowed: false, reason: 'Order has already been fully refunded', maxRefundAmount: 0 };
  }

  if (remainingRefundable <= 0) {
    return { allowed: false, reason: 'No refundable amount remaining', maxRefundAmount: 0 };
  }

  return { allowed: true, reason: null, maxRefundAmount: remainingRefundable };
}

/**
 * Check if an order is eligible to appear on the salesman's active dashboard.
 * ALL conditions must be true.
 * @param {object} order - Order document
 * @param {object} salesman - Salesman user object { uid, tenantId }
 * @returns {boolean}
 */
export function isEligibleForSalesmanDelivery(order, salesman) {
  if (!order || !salesman) return false;

  return (
    order.tenantId === salesman.tenantId &&
    order.assignedSalesmanId === salesman.uid &&
    order.paymentStatus === PAYMENT_STATES.PAID &&
    order.orderStatus === ORDER_STATES.READY_FOR_DELIVERY &&
    order.deliveryStatus === DELIVERY_STATES.NOT_DELIVERED
  );
}

/**
 * Determine new payment status after a refund.
 * @param {number} paidAmount - Total paid amount
 * @param {number} totalRefunded - Total refunded amount (including this refund)
 * @returns {string} New payment status
 */
export function calculatePaymentStatusAfterRefund(paidAmount, totalRefunded) {
  if (totalRefunded >= paidAmount) {
    return PAYMENT_STATES.REFUNDED;
  }
  if (totalRefunded > 0) {
    return PAYMENT_STATES.PARTIALLY_REFUNDED;
  }
  return PAYMENT_STATES.PAID;
}

/**
 * Get the normal order lifecycle progression.
 * @returns {string[]}
 */
export function getOrderLifecycleSteps() {
  return [
    ORDER_STATES.PENDING,
    ORDER_STATES.CONFIRMED,
    ORDER_STATES.PREPARING,
    ORDER_STATES.READY_FOR_DELIVERY,
    ORDER_STATES.COMPLETED,
  ];
}

/**
 * Check if an order status is a terminal state.
 * @param {string} status - Order status
 * @returns {boolean}
 */
export function isTerminalOrderStatus(status) {
  return status === ORDER_STATES.COMPLETED || status === ORDER_STATES.CANCELLED;
}
